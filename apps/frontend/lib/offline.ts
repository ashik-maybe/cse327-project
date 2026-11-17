import Dexie, { type Table } from "dexie"
import type { CreateCaseInput } from "@campbridge/shared"
import { ApiError, casesApi } from "./api"

export type PendingCase = {
  clientId: string
  body: CreateCaseInput & { clientId: string }
  createdAt: number
}

export type CaseUpdatePatch = Partial<CreateCaseInput> & { assignedTo?: string | null }

export type PendingCaseUpdate = {
  id: string
  caseId: string
  patch: CaseUpdatePatch
  createdAt: number
}

export const PENDING_CASES_EVENT = "campbridge:pending-cases-changed"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api"

class OfflineDb extends Dexie {
  pendingCases!: Table<PendingCase, string>
  pendingUpdates!: Table<PendingCaseUpdate, string>

  constructor() {
    super("campbridge")
    this.version(1).stores({ pendingCases: "clientId, createdAt" })
    this.version(2).stores({
      pendingCases: "clientId, createdAt",
      pendingUpdates: "id, caseId, createdAt",
    })
  }
}

let db: OfflineDb | null = null

function getDb(): OfflineDb {
  if (typeof window === "undefined") {
    throw new Error("Offline storage is only available in the browser")
  }
  if (!db) db = new OfflineDb()
  return db
}

function notifyPendingCasesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PENDING_CASES_EVENT))
  }
}

export async function enqueueCase(body: CreateCaseInput & { clientId: string }): Promise<void> {
  await getDb().pendingCases.put({ clientId: body.clientId, body, createdAt: Date.now() })
  notifyPendingCasesChanged()
}

export async function listPendingCases(): Promise<PendingCase[]> {
  if (typeof window === "undefined") return []
  return getDb().pendingCases.orderBy("createdAt").toArray()
}

export async function removePendingCase(clientId: string): Promise<void> {
  await getDb().pendingCases.delete(clientId)
  notifyPendingCasesChanged()
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function enqueueCaseUpdate(
  caseId: string,
  patch: CaseUpdatePatch
): Promise<void> {
  const record: PendingCaseUpdate = {
    id: newId(),
    caseId,
    patch,
    createdAt: Date.now(),
  }
  await getDb().pendingUpdates.put(record)
  notifyPendingCasesChanged()
}

export async function listPendingUpdates(): Promise<PendingCaseUpdate[]> {
  if (typeof window === "undefined") return []
  return getDb().pendingUpdates.orderBy("createdAt").toArray()
}

export async function removePendingUpdate(id: string): Promise<void> {
  await getDb().pendingUpdates.delete(id)
  notifyPendingCasesChanged()
}

let replayInFlight: Promise<{ synced: number; remaining: number }> | null = null

export function replayPendingCases(): Promise<{ synced: number; remaining: number }> {
  if (replayInFlight) return replayInFlight
  replayInFlight = doReplayPendingCases().finally(() => {
    replayInFlight = null
  })
  return replayInFlight
}

async function doReplayPendingCases(): Promise<{ synced: number; remaining: number }> {
  const pending = await listPendingCases()
  let synced = 0
  for (const item of pending) {
    let res: Response
    try {
      res = await fetch(`${API_BASE}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
        credentials: "include",
      })
    } catch {
      // Network failure — still offline or API unreachable. Keep the queue.
      break
    }
    // Backend dedupes on (created_by, client_id); a `created: false` response
    // means the case was already stored, so it is safe to drop from the queue.
    // Any other non-2xx keeps the item so it can be retried later.
    if (res.ok) {
      await removePendingCase(item.clientId)
      synced += 1
    }
  }
  const updates = await listPendingUpdates()
  for (const item of updates) {
    try {
      await casesApi.update(item.caseId, item.patch)
      await removePendingUpdate(item.id)
      synced += 1
    } catch (error) {
      // Network failure — still offline or API unreachable. Keep the queue and
      // stop replaying; other API errors also keep the item for a later retry.
      const networkFailure =
        error instanceof ApiError &&
        (error.status === 0 || error.code === "NETWORK_ERROR" || error.code === "TIMEOUT")
      if (networkFailure) break
    }
  }
  const remaining = (await listPendingCases()).length + (await listPendingUpdates()).length
  return { synced, remaining }
}
