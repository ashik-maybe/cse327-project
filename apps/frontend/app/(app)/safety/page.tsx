"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { safetyApi } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/components/states"

export default function SafetyPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["safety", "reports"],
    queryFn: () => safetyApi.list({}).then((r) => r.items),
  })

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

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((report) => (
            <Card key={report.id} className="border-dashed border-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{report.incidentType}</p>
                <p className="text-sm text-muted-foreground">{report.urgency}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(report.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}