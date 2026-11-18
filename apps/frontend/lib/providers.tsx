"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "./auth"
import { replayPendingCases } from "./offline"

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    void replayPendingCases().catch(() => {})
    const onOnline = () => {
      void replayPendingCases().catch(() => {})
    }
    window.addEventListener("online", onOnline)

    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    return () => window.removeEventListener("online", onOnline)
  }, [])

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <LoginReplay />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

function LoginReplay() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const wasLoggedOut = prevUserIdRef.current === null
    prevUserIdRef.current = userId
    if (wasLoggedOut && userId !== null) {
      void replayPendingCases().catch(() => {})
    }
  }, [userId])

  return null
}
