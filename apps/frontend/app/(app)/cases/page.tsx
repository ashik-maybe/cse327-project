"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { MagnifyingGlass, Plus, MapPin, CaretLeft, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { CategoryLabel, StatusBadge, UrgencyBadge } from "@/components/case-badges"
import { useAuth } from "@/lib/auth"
import { casesApi, type CaseRecord } from "@/lib/api"

const PAGE_SIZE = 10

function formatDate(value?: string) {
  if (!value) return ""
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  )
}

function CaseRow({ item }: { item: CaseRecord }) {
  return (
    <li>
      <Link
        href={`/cases/${item.id}`}
        className="block rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 font-medium">{item.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryLabel category={item.category} />
              {item.locationName ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden />
                  {item.locationName}
                </span>
              ) : null}
              {item.createdAt ? <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <UrgencyBadge urgency={item.urgency} />
            <StatusBadge status={item.status} />
          </div>
        </div>
      </Link>
    </li>
  )
}

export default function CasesPage() {
  const { user } = useAuth()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [urgency, setUrgency] = useState<string>("all")
  const [category, setCategory] = useState<string>("all")
  const [page, setPage] = useState(1)

  const deferredQ = useDeferredValue(q)
  const scope = user?.role === "team_lead" ? "team" : "mine"

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["cases", { q: deferredQ, status, urgency, category, page, scope }],
    queryFn: () =>
      casesApi.list({
        scope,
        q: deferredQ || undefined,
        status: status === "all" ? undefined : status,
        urgency: urgency === "all" ? undefined : urgency,
        category: category === "all" ? undefined : category,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function resetPage() {
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "team_lead" ? "Every case across the team." : "Cases you created or were assigned."}
          </p>
        </div>
        <Button render={<Link href="/cases/new" />}>
          <Plus data-icon="inline-start" aria-hidden />
          New case
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(event) => {
              setQ(event.target.value)
              resetPage()
            }}
            placeholder="Search summary or description"
            aria-label="Search cases"
            className="pl-8"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? "all")
            resetPage()
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="referred">Referred</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={urgency}
          onValueChange={(value) => {
            setUrgency(value ?? "all")
            resetPage()
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by urgency">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgency</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value ?? "all")
            resetPage()
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="shelter">Shelter</SelectItem>
            <SelectItem value="protection">Protection</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="wash">WASH</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingState label="Loading cases…" /> : null}

      {isError ? (
        <ErrorState
          title="Could not load cases"
          description="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          title={deferredQ || status !== "all" || urgency !== "all" || category !== "all" ? "No matching cases" : "No cases yet"}
          description={
            deferredQ || status !== "all" || urgency !== "all" || category !== "all"
              ? "Try clearing filters or a shorter search."
              : "Log the first community request."
          }
          action={
            <Button size="sm" render={<Link href="/cases/new" />}>
              Log a case
            </Button>
          }
        />
      ) : null}

      {items.length > 0 ? (
        <Card>
          <CardContent className="p-2">
            <ul className="space-y-2" aria-busy={isFetching}>
              {items.map((item) => (
                <CaseRow key={item.id} item={item} />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {total > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {total} case{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <CaretLeft data-icon="inline-start" aria-hidden />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
              <CaretRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
