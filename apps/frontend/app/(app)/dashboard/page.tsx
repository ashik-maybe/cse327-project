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
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState, formatDateTime } from "@/components/states"
import { StatusBadge, UrgencyBadge } from "@/components/case-badges"
import { useAuth } from "@/lib/auth"
import { casesApi, dashboardApi } from "@/lib/api"

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

  const queueQuery = useQuery({
    queryKey: ["cases", "queue", user?.role],
    queryFn: () => casesApi.list({ limit: 5 }),
    enabled: Boolean(user),
  })

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
        {queueQuery.isLoading ? <LoadingState label="Loading case queue…" /> : null}
        {queueQuery.isError ? (
          <ErrorState
            title="Could not load the case queue"
            description="Check your connection and try again."
            action={
              <Button variant="outline" size="sm" onClick={() => void queueQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : null}
        {queueQuery.data && queueQuery.data.items.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description={isLead ? "No cases need attention right now." : "No cases are assigned to you right now."}
            action={
              <Button size="sm" render={<Link href="/cases/new" />}>
                Log a case
              </Button>
            }
          />
        ) : null}
        {queueQuery.data && queueQuery.data.items.length > 0 ? (
          <ul className="space-y-2">
            {queueQuery.data.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/cases/${item.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium">{item.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.assigneeName ?? "Unassigned"} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UrgencyBadge urgency={item.urgency} />
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
