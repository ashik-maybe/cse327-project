"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowSquareOut, MapPin, SlidersHorizontal } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { categoryColor, categoryLabel, directionsUrl, SERVICE_CATEGORY_META } from "@/components/map/categories"
import { useAuth } from "@/lib/auth"
import { servicePointsApi } from "@/lib/api"

const ServiceMap = dynamic(() => import("@/components/map/service-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center">
      <LoadingState label="Loading map…" />
    </div>
  ),
})

const CATEGORY_FILTERS = [{ key: "all", label: "All points" }, ...Object.entries(SERVICE_CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label }))]

export default function MapPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState("all")
  const isLead = user?.role === "team_lead"

  const query = useQuery({
    queryKey: ["service-points", category],
    queryFn: () => servicePointsApi.list(category === "all" ? undefined : { category }),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service map</h1>
          <p className="text-sm text-muted-foreground">Find active service points for referrals.</p>
        </div>
        {isLead ? (
          <Button variant="outline" size="sm" render={<Link href="/map/manage" />}>
            <SlidersHorizontal data-icon="inline-start" aria-hidden />
            Manage points
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by service category">
        {CATEGORY_FILTERS.map((filter) => {
          const active = category === filter.key
          return (
            <Button
              key={filter.key}
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => setCategory(filter.key)}
            >
              {filter.label}
            </Button>
          )
        })}
      </div>

      {query.isError ? (
        <ErrorState
          title="Could not load service points"
          description="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      ) : null}

      <Card className="relative z-0 overflow-hidden p-0">
        <CardContent className="h-[420px] p-0">
          {query.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingState label="Loading service points…" />
            </div>
          ) : null}
          {query.isError ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Map unavailable. Use the list below.
            </div>
          ) : null}
          {query.data ? <ServiceMap points={query.data} /> : null}
        </CardContent>
      </Card>

      {query.data && query.data.length === 0 ? (
        <EmptyState title="No service points" description="No active points match this filter." />
      ) : null}

      {query.data && query.data.length > 0 ? (
        <section className="space-y-3" aria-label="Service point list">
          <h2 className="text-lg font-semibold tracking-tight">
            Points list <span className="text-sm font-normal text-muted-foreground">({query.data.length})</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {query.data.map((point) => (
              <Card key={point.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-5 shrink-0" style={{ color: categoryColor(point.category) }} aria-hidden />
                    <div>
                      <p className="font-medium">{point.name}</p>
                      <p className="text-sm text-muted-foreground">{categoryLabel(point.category)}</p>
                    </div>
                  </div>
                  {point.area ? <p className="text-sm">{point.area}</p> : null}
                  {point.openingHours ? <p className="text-sm text-muted-foreground">{point.openingHours}</p> : null}
                  {point.contactNote ? <p className="text-sm text-muted-foreground">{point.contactNote}</p> : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </p>
                    <a
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      href={directionsUrl(point)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions
                      <ArrowSquareOut className="size-4" aria-hidden />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
