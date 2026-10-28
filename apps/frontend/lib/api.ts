import type { CreateCaseInput } from "@campbridge/shared"

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api"

export class ApiError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  timeoutMs?: number
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs, signal } = options
  const controller = new AbortController()
  const timeout = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined

  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: controller.signal,
    })
  } catch (err) {
    if (controller.signal.aborted) {
      throw new ApiError("Request timed out", "TIMEOUT", 408)
    }
    throw new ApiError("Network unavailable", "NETWORK_ERROR", 0)
  } finally {
    if (timeout) clearTimeout(timeout)
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.error?.message ?? "Request failed"
    const code = data?.error?.code ?? "UNKNOWN"
    throw new ApiError(message, code, res.status)
  }

  return data as T
}

export const get = <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(path, { ...options, method: "GET" })

export const post = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(path, { ...options, method: "POST", body })

export const patch = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(path, { ...options, method: "PATCH", body })

export const del = <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(path, { ...options, method: "DELETE" })

// ---- Domain helpers ----

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number }

export type MeResponse = {
  user: { id: string; name: string; email: string; role: "volunteer" | "team_lead" } | null
}

export const authApi = {
  login: (email: string, password: string) =>
    post<MeResponse>("/auth/login", { email, password }),
  register: (input: { name: string; email: string; password: string; role?: string }) =>
    post<MeResponse>("/auth/register", input),
  logout: () => post<{ ok: boolean }>("/auth/logout"),
  me: () => get<MeResponse>("/auth/me"),
}

export type CaseRecord = {
  id: string
  summary: string
  description?: string | null
  category: string
  urgency: string
  status: string
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  nextContact?: string | null
  source?: string
  aiAssisted?: boolean
  aiSource?: string | null
  createdBy?: string | null
  assignedTo?: string | null
  createdAt?: string
  updatedAt?: string
}

export const casesApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== "") qs.set(k, String(v))
    }
    const suffix = qs.toString() ? `?${qs}` : ""
    return get<Paginated<CaseRecord>>(`/cases${suffix}`)
  },
  get: (id: string) => get<CaseRecord>(`/cases/${id}`),
  create: (input: CreateCaseInput) => post<{ case: CaseRecord; created: boolean }>("/cases", input),
  update: (id: string, input: Partial<CreateCaseInput>) => patch<CaseRecord>(`/cases/${id}`, input),
  notes: (id: string) => get<Array<{ note: string; createdAt: string; userName?: string }>>(`/cases/${id}/notes`),
  addNote: (id: string, note: string) => post(`/cases/${id}/notes`, { note }),
}

export type SafetyRecord = {
  id: string
  incidentType: "threat" | "harassment" | "other"
  anonymizedDescription: string
  originalDescription?: string | null
  storeOriginal: boolean
  approximateLocation?: string | null
  urgency: "low" | "medium" | "high" | "critical"
  status: "new" | "acknowledged" | "resolved"
  createdAt: string
  createdBy?: string | null
}

export const dashboardApi = {
  summary: () => get<DashboardSummary>("/dashboard/summary"),
}

export const safetyApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== "") qs.set(k, String(v))
    }
    const suffix = qs.toString() ? `?${qs}` : ""
    return get<Paginated<SafetyRecord>>(`/safety${suffix}`)
  },
  get: (id: string) => get<SafetyRecord>(`/safety/${id}`),
  create: (input: {
    incidentType: SafetyRecord["incidentType"]
    anonymizedDescription: string
    originalDescription?: string
    storeOriginal?: boolean
    approximateLocation?: string
    urgency: SafetyRecord["urgency"]
  }) => post<SafetyRecord>("/safety", input),
  updateStatus: (id: string, status: SafetyRecord["status"]) => patch<SafetyRecord>(`/safety/${id}`, { status }),
}

export type { SafetyRecord } from "@campbridge/shared"

