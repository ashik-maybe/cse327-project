"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { safetyApi, type SafetyRecord } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/components/states"

const SAFETY_STATUSES = ["new", "acknowledged", "resolved"] as const

export default function SafetyPage() {
  const { user } = useAuth()
  const isLead = user?.role === "team_lead"
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["safety", "reports"],
    queryFn: () => safetyApi.list({}).then((r) => r.items),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SafetyRecord["status"] }) =>
      safetyApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["safety"] })
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] })
    },
  })

  const statusError = updateStatus.isError ? "Could not update the report status. Try again." : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Safety reports</h1>
      <p className="text-sm text-muted-foreground">
        Anonymized safety reports for the team.
      </p>

      {isLoading ? <LoadingState label="Loading safety reports…" /> : null}

      {isError ? (
        <ErrorState
          title="Could not load safety reports"
          description="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      ) : null}

      {data && data.length === 0 ? (
        <EmptyState
          title="No safety reports yet"
          description="Create your first safety report to start."
          action={
            <Button size="sm" render={<Link href="/safety/new" />}>
              Create report
            </Button>
          }
        />
      ) : null}

      {statusError ? (
        <Alert variant="destructive">
          <AlertDescription>{statusError}</AlertDescription>
        </Alert>
      ) : null}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((report) => (
            <Card key={report.id} className="border-dashed border-muted/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground capitalize">{report.incidentType}</p>
                <p className="text-sm text-muted-foreground capitalize">Urgency: {report.urgency}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(report.createdAt)}</p>
                {isLead ? (
                  <div className="pt-1">
                    <Select
                      value={report.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({ id: report.id, status: value as SafetyRecord["status"] })
                      }
                    >
                      <SelectTrigger aria-label="Report status" className="w-full" disabled={updateStatus.isPending}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SAFETY_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground capitalize">Status: {report.status}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}