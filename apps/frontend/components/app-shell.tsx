"use client"

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SignOut, FirstAid } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { LoadingState, OfflineBadge } from "@/components/states"
import { ThemeToggle } from "@/components/theme-toggle"
import { DesktopNav, MobileNav } from "@/components/app-nav"
import { useAuth } from "@/lib/auth"
import { authApi } from "@/lib/api"
import { listPendingCases, PENDING_CASES_EVENT } from "@/lib/offline"

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getOnlineSnapshot() {
  return navigator.onLine
}

function getOnlineServerSnapshot() {
  return true
}

function roleLabel(role: string) {
  return role === "team_lead" ? "Team Lead" : "Volunteer"
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isOnline = useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getOnlineServerSnapshot)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      listPendingCases()
        .then((items) => {
          if (!cancelled) setPendingCount(items.length)
        })
        .catch(() => {
          if (!cancelled) setPendingCount(0)
        })
    }
    refresh()
    window.addEventListener(PENDING_CASES_EVENT, refresh)
    window.addEventListener("online", refresh)
    return () => {
      cancelled = true
      window.removeEventListener(PENDING_CASES_EVENT, refresh)
      window.removeEventListener("online", refresh)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login")
  }, [isLoading, user, router])

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear()
      router.replace("/login")
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState label="Checking session…" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState label="Redirecting to sign in…" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-3 py-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <FirstAid className="size-6 text-primary" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">CampBridge</span>
        </div>
        <DesktopNav />
        <div className="mt-auto rounded-lg bg-muted/60 p-3">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <FirstAid className="size-5 text-primary" aria-hidden />
            <span className="font-semibold tracking-tight">CampBridge</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            {!isOnline ? <OfflineBadge /> : null}
            {pendingCount > 0 ? (
              <span
                className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                title="Cases queued offline — they sync when you are back online"
              >
                {pendingCount} pending
              </span>
            ) : null}
            <span className="mr-1 hidden rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
              {roleLabel(user.role)}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <SignOut className="size-5" aria-hidden />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 md:pb-10 lg:px-8">
          {children}
        </main>
      </div>

      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
