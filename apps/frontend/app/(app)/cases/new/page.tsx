"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"
import { createCaseSchema } from "@campbridge/shared"
import { ArrowLeft, Sparkle, PaperPlaneTilt } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError, casesApi } from "@/lib/api"

type CaseValues = z.infer<typeof createCaseSchema>

export default function NewCasePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const clientId = useRef<string>(crypto.randomUUID())
  const [coordinatesOpen, setCoordinatesOpen] = useState(false)

  const form = useForm<CaseValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      summary: "",
      description: "",
      category: "shelter",
      urgency: "medium",
      status: "new",
      locationName: "",
      nextContact: "",
      source: "manual",
      aiAssisted: false,
    },
  })
  const category = useWatch({ control: form.control, name: "category" })
  const urgency = useWatch({ control: form.control, name: "urgency" })

  const create = useMutation({
    mutationFn: (values: CaseValues) =>
      casesApi.create({ ...values, clientId: clientId.current }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["cases"] })
      router.replace(`/cases/${data.case.id}`)
    },
  })

  const errorMessage =
    create.error instanceof ApiError ? create.error.message : create.error ? "Could not save the case." : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link href="/cases" />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Back to cases
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Log a new case</h1>
        <p className="text-sm text-muted-foreground">
          Record the request while it is fresh. AI intake arrives in the next milestone.
        </p>
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-start gap-3 py-4">
          <Sparkle className="mt-0.5 size-5 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">AI intake coming next</p>
            <p className="text-xs text-muted-foreground">
              Bangla voice or text will fill this form automatically. You can still enter every field manually now.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                placeholder="Family needs urgent shelter repair"
                aria-invalid={Boolean(form.formState.errors.summary)}
                {...form.register("summary")}
              />
              {form.formState.errors.summary ? (
                <p className="text-xs text-destructive">{form.formState.errors.summary.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="What did the community member report?"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => form.setValue("category", value as CaseValues["category"], { shouldValidate: true })}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shelter">Shelter</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="wash">WASH</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={urgency}
                  onValueChange={(value) => form.setValue("urgency", value as CaseValues["urgency"], { shouldValidate: true })}
                >
                  <SelectTrigger id="urgency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="locationName">Location</Label>
                <Input id="locationName" placeholder="Block C, near water point" {...form.register("locationName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextContact">Next contact</Label>
                <Input id="nextContact" placeholder="Shelter Focal Point" {...form.register("nextContact")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Exact coordinates (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setCoordinatesOpen((open) => !open)}
                >
                  {coordinatesOpen ? "Hide" : "Add"}
                </Button>
              </div>
              {coordinatesOpen ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    aria-label="Latitude"
                    {...form.register("latitude", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    aria-label="Longitude"
                    {...form.register("longitude", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                  />
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                Draft ID keeps retries idempotent if the connection drops.
              </p>
              <Button type="submit" disabled={create.isPending}>
                <PaperPlaneTilt data-icon="inline-start" aria-hidden />
                {create.isPending ? "Saving…" : "Save case"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
