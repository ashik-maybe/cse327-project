"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, MapPin, User, Clock, PaperPlaneTilt, ChatCircleText } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
import { ApiError, casesApi } from "@/lib/api"

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")

  const isLead = user?.role === "team_lead"

  const caseQuery = useQuery({
    queryKey: ["cases", id],
    queryFn: () => casesApi.get(id),
  })

  const notesQuery = useQuery({
    queryKey: ["cases", id, "notes"],
    queryFn: () => casesApi.notes(id),
  })

  const statusMutation = useMutation({
    mutationFn: (status: "new" | "in_progress" | "referred" | "resolved") => casesApi.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", id] })
      void queryClient.invalidateQueries({ queryKey: ["cases"] })
    },
  })

  const addNote = useMutation({
    mutationFn: (text: string) => casesApi.addNote(id, text),
    onSuccess: () => {
      setNote("")
      void queryClient.invalidateQueries({ queryKey: ["cases", id, "notes"] })
    },
  })

  if (caseQuery.isLoading) {
    return <LoadingState label="Loading case…" />
  }

  if (caseQuery.isError) {
    const forbidden = caseQuery.error instanceof ApiError && (caseQuery.error.status === 403 || caseQuery.error.status === 404)
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/cases" />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to cases
        </Button>
        <ErrorState
          title={forbidden ? "You cannot view this case" : "Could not load this case"}
          description={forbidden ? "It may belong to another volunteer." : "Check your connection and try again."}
          action={
            <Button variant="outline" size="sm" onClick={() => void caseQuery.refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  const item = caseQuery.data
  if (!item) return null

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link href="/cases" />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to cases
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <UrgencyBadge urgency={item.urgency} />
              <StatusBadge status={item.status} />
              <CategoryLabel category={item.category} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{item.summary}</h1>
          </div>
          {isLead ? (
            <div className="w-full sm:w-44">
              <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted-foreground">
                Update status
              </label>
              <Select
                value={item.status}
                onValueChange={(value) => {
                  if (value) statusMutation.mutate(value as "new" | "in_progress" | "referred" | "resolved")
                }}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="referred">Referred</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">{item.description || "No description provided."}</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Location">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground" aria-hidden />
                  {item.locationName || "Not specified"}
                </span>
              </Field>
              <Field label="Next contact">{item.nextContact || "Not specified"}</Field>
              <Field label="Source">{item.source === "voice" ? "Voice intake" : "Manual entry"}</Field>
              <Field label="AI assisted">{item.aiAssisted ? `Yes (${item.aiSource ?? "AI"})` : "No"}</Field>
              <Field label="Created">{formatDateTime(item.createdAt)}</Field>
              <Field label="Updated">{formatDateTime(item.updatedAt)}</Field>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" aria-hidden />
              <span>Assigned: {item.assignedTo ? item.assignedTo.slice(0, 8) : "Unassigned"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              <span>Opened {formatDateTime(item.createdAt)}</span>
            </div>
            {item.latitude != null && item.longitude != null ? (
              <p className="text-xs text-muted-foreground">
                Coordinates {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChatCircleText className="size-4 text-muted-foreground" aria-hidden />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              const text = note.trim()
              if (text) addNote.mutate(text)
            }}
          >
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a follow-up note…"
              aria-label="New note"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!note.trim() || addNote.isPending}>
                <PaperPlaneTilt data-icon="inline-start" aria-hidden />
                {addNote.isPending ? "Adding…" : "Add note"}
              </Button>
            </div>
          </form>

          {notesQuery.isLoading ? <LoadingState label="Loading notes…" /> : null}

          {notesQuery.isError ? (
            <ErrorState title="Could not load notes" description="Try again in a moment." />
          ) : null}

          {!notesQuery.isLoading && !notesQuery.isError && (notesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title="No notes yet" description="Add the first follow-up note above." />
          ) : null}

          <ul className="space-y-3">
            {notesQuery.data?.map((entry, index) => (
              <li key={`${entry.createdAt}-${index}`} className="rounded-lg border p-3">
                <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entry.userName ?? "Teammate"} · {formatDateTime(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
