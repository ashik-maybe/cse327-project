"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Warning,
  Clock,
  UserCircleCheck,
  FolderOpen,
  ShieldWarning,
  MapTrifold,
  Plus,
  ArrowRight,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { useAuth } from "@/lib/auth"
import { dashboardApi } from "@/lib/api"

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "danger" | "warning"
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary"

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={`rounded-xl bg-muted/60 p-2.5 ${toneClass}`}>
          <Icon className="size-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
  })

  const isLead = user?.role === "team_lead"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isLead ? "Team overview" : "My dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLead
            ? "Monitor the queue and keep urgent cases moving."
            : "Your assigned work and recent community requests."}
        </p>
      </div>

      <section aria-label="Quick actions" className="grid grid-cols-3 gap-2 sm:max-w-xl">
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-3" render={<Link href="/cases/new" />}>
          <Plus className="size-5" aria-hidden />
          <span className="text-xs font-medium">New case</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-3" render={<Link href="/safety/new" />}>
          <ShieldWarning className="size-5" aria-hidden />
          <span className="text-xs font-medium">Safety report</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1.5 py-3" render={<Link href="/map" />}>
          <MapTrifold className="size-5" aria-hidden />
          <span className="text-xs font-medium">Open map</span>
        </Button>
      </section>

      {isLoading ? <LoadingState label="Loading summary…" /> : null}

      {isError ? (
        <ErrorState
          title="Could not load your summary"
          description="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {data && data.role === "volunteer" ? (
        <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="High urgency" value={data.highUrgencyCount} icon={Warning} tone="danger" />
          <StatCard label="Stale cases" value={data.staleCaseCount} icon={Clock} tone="warning" />
          <StatCard label="Assigned to me" value={data.assignedToMeCount} icon={UserCircleCheck} />
          <StatCard label="Recent cases" value={data.recentCaseCount} icon={FolderOpen} />
        </section>
      ) : null}

      {data && data.role === "team_lead" ? (
        <section aria-label="Team numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="High urgency" value={data.highUrgencyCount} icon={Warning} tone="danger" />
          <StatCard label="Stale cases" value={data.staleCaseCount} icon={Clock} tone="warning" />
          <StatCard label="Unassigned" value={data.unassignedCount} icon={UserCircleCheck} />
          <StatCard label="Recent safety reports" value={data.recentSafetyCount} icon={ShieldWarning} />
        </section>
      ) : null}

      <section aria-label="Case queue" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Case queue</h2>
          <Button variant="ghost" size="sm" render={<Link href="/cases" />}>
            View all <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>
        <EmptyState
          title="Queue is clear"
          description={isLead ? "No cases need attention right now." : "No cases are assigned to you right now."}
          action={
            <Button size="sm" render={<Link href="/cases/new" />}>
              Log a case
            </Button>
          }
        />
      </section>
    </div>
  )
}
