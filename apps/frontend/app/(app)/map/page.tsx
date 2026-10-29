"use client"

import { useQuery } from "@tanstack/react-query"
import { MapPin } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { servicePointsApi } from "@/lib/api"

export default function MapPage() {
  const query = useQuery({ queryKey: ["service-points"], queryFn: servicePointsApi.list })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Service map</h1>
        <p className="text-sm text-muted-foreground">Find active service points for referrals.</p>
      </div>
      {query.isLoading ? <LoadingState label="Loading service points…" /> : null}
      {query.isError ? <ErrorState title="Could not load service points" description="Check your connection and try again." /> : null}
      {query.data?.length === 0 ? <EmptyState title="No service points" description="No active points are available." /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {query.data?.map((point) => (
          <Card key={point.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{point.name}</p>
                  <p className="text-sm text-muted-foreground">{point.category}</p>
                </div>
              </div>
              {point.area ? <p className="text-sm">{point.area}</p> : null}
              <p className="text-xs text-muted-foreground">{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
