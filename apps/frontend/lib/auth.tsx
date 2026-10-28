"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { authApi, type MeResponse } from "./api"

export type User = NonNullable<MeResponse["user"]>

type AuthState = {
  user: User | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    staleTime: 60_000,
    retry: false,
  })

  return (
    <AuthContext.Provider
      value={{ user: data?.user ?? null, isLoading, isError, refetch: () => void refetch() }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
