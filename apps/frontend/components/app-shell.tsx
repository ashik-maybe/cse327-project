"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SignOut, FirstAid } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/states"
import { ThemeToggle } from "@/components/theme-toggle"
import { DesktopNav, MobileNav } from "@/components/app-nav"
import { useAuth } from "@/lib/auth"
import { authApi } from "@/lib/api"

function roleLabel(role: string) {
  return role === "team_lead" ? "Team Lead" : "Volunteer"
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

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
