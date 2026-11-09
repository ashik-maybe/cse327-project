"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FloppyDisk, PencilSimple, Plus, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, ErrorState, LoadingState } from "@/components/states"
import { SERVICE_CATEGORY_META, categoryLabel } from "@/components/map/categories"
import { useAuth } from "@/lib/auth"
import { ApiError, servicePointsApi, type ServicePointRecord } from "@/lib/api"
import type { CreateServicePointInput } from "@campbridge/shared"

type ServiceCategory = CreateServicePointInput["category"]

type PointForm = {
  name: string
  category: ServiceCategory
  area: string
  description: string
  contactNote: string
  openingHours: string
  latitude: string
  longitude: string
  active: string
}

const EMPTY_FORM: PointForm = {
  name: "",
  category: "health_post",
  area: "",
  description: "",
  contactNote: "",
  openingHours: "",
  latitude: "21.1952",
  longitude: "92.1523",
  active: "active",
}

function toForm(point: ServicePointRecord): PointForm {
  return {
    name: point.name,
    category: point.category as ServiceCategory,
    area: point.area ?? "",
    description: point.description ?? "",
    contactNote: point.contactNote ?? "",
    openingHours: point.openingHours ?? "",
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    active: point.isActive ? "active" : "inactive",
  }
}

export default function ManageMapPage() {
  const { user } = useAuth()
  const isLead = user?.role === "team_lead"
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PointForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ["service-points", "manage"],
    queryFn: () => servicePointsApi.list({ includeInactive: true }),
    enabled: isLead,
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["service-points"] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const latitude = Number(form.latitude)
      const longitude = Number(form.longitude)
      if (!form.name.trim()) throw new ApiError("Name is required", "VALIDATION_ERROR", 400)
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new ApiError("Latitude must be between -90 and 90", "VALIDATION_ERROR", 400)
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new ApiError("Longitude must be between -180 and 180", "VALIDATION_ERROR", 400)
      }
      const payload = {
        name: form.name.trim(),
        category: form.category,
        latitude,
        longitude,
        area: form.area.trim() || undefined,
        description: form.description.trim() || undefined,
        contactNote: form.contactNote.trim() || undefined,
        openingHours: form.openingHours.trim() || undefined,
      }
      if (editingId) {
        return servicePointsApi.update(editingId, { ...payload, isActive: form.active === "active" })
      }
      return servicePointsApi.create(payload)
    },
    onSuccess: () => {
      setEditingId(null)
      setForm(EMPTY_FORM)
      setFormError(null)
      invalidate()
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Could not save service point")
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (point: ServicePointRecord) => servicePointsApi.update(point.id, { isActive: !point.isActive }),
    onSuccess: invalidate,
  })

  if (!isLead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/map" />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to map
        </Button>
        <ErrorState title="Leads only" description="Team leads manage service points." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link href="/map" />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to map
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Manage service points</h1>
        <p className="text-sm text-muted-foreground">Add, edit, deactivate, or restore referral points.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Edit service point" : "Add service point"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              saveMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(value) => value && setForm({ ...form, category: value as ServiceCategory })}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SERVICE_CATEGORY_META).map((key) => (
                    <SelectItem key={key} value={key}>
                      {categoryLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="area">Area</Label>
              <Input id="area" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="openingHours">Opening hours</Label>
              <Input
                id="openingHours"
                value={form.openingHours}
                placeholder="08:00-18:00"
                onChange={(event) => setForm({ ...form, openingHours: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={(event) => setForm({ ...form, latitude: event.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={(event) => setForm({ ...form, longitude: event.target.value })}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="contactNote">Contact note</Label>
              <Textarea
                id="contactNote"
                rows={2}
                value={form.contactNote}
                onChange={(event) => setForm({ ...form, contactNote: event.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            {editingId ? (
              <div className="space-y-1">
                <Label htmlFor="active">Status</Label>
                <Select value={form.active} onValueChange={(value) => value && setForm({ ...form, active: value })}>
                  <SelectTrigger id="active" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {formError ? (
              <p className="text-sm text-destructive sm:col-span-2" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {editingId ? <FloppyDisk data-icon="inline-start" aria-hidden /> : <Plus data-icon="inline-start" aria-hidden />}
                {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Add point"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null)
                    setForm(EMPTY_FORM)
                    setFormError(null)
                  }}
                >
                  <X data-icon="inline-start" aria-hidden />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingState label="Loading service points…" /> : null}
      {query.isError ? <ErrorState title="Could not load service points" description="Try again in a moment." /> : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState title="No service points" description="Add the first point above." />
      ) : null}

      {query.data && query.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {query.data.map((point) => (
            <Card key={point.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{point.name}</p>
                    <p className="text-sm text-muted-foreground">{categoryLabel(point.category)}</p>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {point.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {point.area ? <p className="text-sm">{point.area}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(point.id)
                      setForm(toForm(point))
                      setFormError(null)
                    }}
                  >
                    <PencilSimple data-icon="inline-start" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={point.isActive ? "destructive" : "secondary"}
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(point)}
                  >
                    {point.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
