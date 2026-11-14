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
import { ApiError, aiApi, casesApi, type CaseIntakeInput, type CaseIntakeResponse } from "@/lib/api"

type CaseValues = z.infer<typeof createCaseSchema>

const SAMPLE_FIXTURES = [
  { id: "sample-1", label: "Shelter roof collapsed (sample)" },
  { id: "sample-2", label: "Mother's fever, no medicine (sample)" },
  { id: "sample-3", label: "Ration not received (sample)" },
] as const

const CASE_CATEGORIES = ["shelter", "protection", "food", "wash", "health", "other"] as const
const CASE_URGENCIES = ["low", "medium", "high", "critical"] as const

export default function NewCasePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const clientId = useRef<string>(crypto.randomUUID())
  const [coordinatesOpen, setCoordinatesOpen] = useState(false)
  const [banglaText, setBanglaText] = useState("")
  const [aiResult, setAiResult] = useState<CaseIntakeResponse | null>(null)
  const [aiSource, setAiSource] = useState<string | null>(null)

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

  const analyze = useMutation({
    mutationFn: (input: CaseIntakeInput) => aiApi.caseIntake(input),
    onSuccess: (data) => {
      setAiResult(data)
      setAiSource(null)
    },
  })

  const applyAiResult = () => {
    if (!aiResult) return
    const category = (CASE_CATEGORIES as readonly string[]).includes(aiResult.category)
      ? (aiResult.category as CaseValues["category"])
      : "other"
    const urgency = (CASE_URGENCIES as readonly string[]).includes(aiResult.urgency)
      ? (aiResult.urgency as CaseValues["urgency"])
      : "medium"
    form.setValue("summary", aiResult.englishSummary, { shouldValidate: true })
    form.setValue("description", aiResult.originalText ?? "", { shouldValidate: true })
    form.setValue("category", category, { shouldValidate: true })
    form.setValue("urgency", urgency, { shouldValidate: true })
    form.setValue("nextContact", aiResult.nextContact ?? "", { shouldValidate: true })
    form.setValue("aiAssisted", true)
    form.setValue("aiSource", aiResult.provider)
    setAiSource(aiResult.provider)
  }

  const analyzeError =
    analyze.error instanceof ApiError
      ? analyze.error.message
      : analyze.error
        ? "AI intake failed. You can still fill the form manually."
        : null

  const create = useMutation({
    mutationFn: (values: CaseValues) =>
      casesApi.create({
        ...values,
        clientId: clientId.current,
        ...(aiSource ? { aiAssisted: true, aiSource } : {}),
      }),
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
          Record the request while it is fresh. AI intake can draft the form from a Bangla note — review it before saving.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkle className="size-4 text-primary" aria-hidden />
            AI intake
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="banglaText">Bangla note</Label>
            <Textarea
              id="banglaText"
              rows={3}
              placeholder="এখানে বাংলায় লিখুন…"
              value={banglaText}
              onChange={(event) => setBanglaText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste or type what the community member said. AI drafts the form — you review and edit before saving.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_FIXTURES.map((sample) => (
              <Button
                key={sample.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={analyze.isPending}
                onClick={() => analyze.mutate({ sampleId: sample.id })}
              >
                {sample.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={analyze.isPending || banglaText.trim().length === 0}
              onClick={() => analyze.mutate({ banglaText: banglaText.trim() })}
            >
              {analyze.isPending ? "Analyzing…" : "Analyze"}
            </Button>
            {aiSource ? (
              <span className="text-xs text-muted-foreground">Applied — saved as AI-assisted ({aiSource})</span>
            ) : null}
          </div>

          {analyzeError ? (
            <Alert variant="destructive">
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          ) : null}

          {aiResult ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">AI draft preview</p>
                <span className="text-xs text-muted-foreground">provider: {aiResult.provider}</span>
              </div>
              <p>{aiResult.englishSummary}</p>
              <dl className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                <div><dt className="inline font-medium">Category: </dt><dd className="inline">{aiResult.category}</dd></div>
                <div><dt className="inline font-medium">Urgency: </dt><dd className="inline">{aiResult.urgency}</dd></div>
                <div><dt className="inline font-medium">Next contact: </dt><dd className="inline">{aiResult.nextContact}</dd></div>
              </dl>
              <Button type="button" size="sm" variant="secondary" onClick={applyAiResult}>
                Apply to form
              </Button>
            </div>
          ) : null}
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
