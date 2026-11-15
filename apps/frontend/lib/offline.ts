import Dexie, { type Table } from "dexie"
import type { CreateCaseInput } from "@campbridge/shared"

export type PendingCase = {
  clientId: string
  body: CreateCaseInput & { clientId: string }
  createdAt: number
}

export const PENDING_CASES_EVENT = "campbridge:pending-cases-changed"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api"

class OfflineDb extends Dexie {
  pendingCases!: Table<PendingCase, string>

  constructor() {
    super("campbridge")
    this.version(1).stores({ pendingCases: "clientId, createdAt" })
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
  const remaining = (await listPendingCases()).length
  return { synced, remaining }
}
