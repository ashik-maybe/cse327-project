"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { createSafetySchema } from "@campbridge/shared"
import { ArrowLeft, Eraser } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiError, aiApi, safetyApi } from "@/lib/api"

type Values = z.infer<typeof createSafetySchema>

export default function NewSafetyReportPage() {
  const router = useRouter()
  const form = useForm<Values>({
    resolver: zodResolver(createSafetySchema),
    defaultValues: { incidentType: "other", urgency: "medium", anonymizedDescription: "", storeOriginal: false },
  })
  const incidentType = useWatch({ control: form.control, name: "incidentType" })
  const urgency = useWatch({ control: form.control, name: "urgency" })
  const [sourceText, setSourceText] = useState("")
  const [redactionCount, setRedactionCount] = useState<number | null>(null)
  const [anonymizeProvider, setAnonymizeProvider] = useState<string | null>(null)

  const anonymize = useMutation({
    mutationFn: (text: string) => aiApi.anonymize(text),
    onSuccess: (data) => {
      form.setValue("anonymizedDescription", data.anonymizedText, { shouldValidate: true })
      setRedactionCount(data.redactionCount)
      setAnonymizeProvider(data.provider)
    },
  })
  const anonymizeError =
    anonymize.error instanceof ApiError
      ? anonymize.error.message
      : anonymize.error
        ? "Could not anonymize the text. You can still write the description manually."
        : null
  const create = useMutation({
    mutationFn: safetyApi.create,
    onSuccess: () => router.replace("/safety"),
  })
  const error = create.error instanceof ApiError ? create.error.message : create.error ? "Could not save report." : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/safety" />}>
        <ArrowLeft data-icon="inline-start" aria-hidden /> Back to safety
      </Button>
      <Card>
        <CardHeader><CardTitle>New safety report</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => create.mutate(values))} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="incidentType">Incident type</Label>
              <Select value={incidentType} onValueChange={(value) => form.setValue("incidentType", value as Values["incidentType"], { shouldValidate: true })}>
                <SelectTrigger id="incidentType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="threat">Threat</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={urgency} onValueChange={(value) => form.setValue("urgency", value as Values["urgency"], { shouldValidate: true })}>
                <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              <Label htmlFor="sourceText">Original note (not saved)</Label>
              <Textarea
                id="sourceText"
                rows={4}
                placeholder="Paste the original note with names, phone numbers, or other identifying details…"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={anonymize.isPending || sourceText.trim().length === 0}
                  onClick={() => anonymize.mutate(sourceText.trim())}
                >
                  <Eraser data-icon="inline-start" aria-hidden />
                  {anonymize.isPending ? "Anonymizing…" : "Anonymize preview"}
                </Button>
                {redactionCount !== null ? (
                  <span className="text-xs text-muted-foreground">
                    {redactionCount} redaction{redactionCount === 1 ? "" : "s"}
                    {anonymizeProvider ? ` · provider: ${anonymizeProvider}` : ""}
                  </span>
                ) : null}
              </div>
              {anonymizeError ? (
                <Alert variant="destructive">
                  <AlertDescription>{anonymizeError}</AlertDescription>
                </Alert>
              ) : null}
              <p className="text-xs text-muted-foreground">
                The anonymized text fills the description below. The original note stays on this page and is never submitted.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anonymizedDescription">Anonymized description</Label>
              <Textarea id="anonymizedDescription" rows={6} {...form.register("anonymizedDescription")} />
              {form.formState.errors.anonymizedDescription ? <p className="text-xs text-destructive">{form.formState.errors.anonymizedDescription.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approximateLocation">Approximate location</Label>
              <Input id="approximateLocation" {...form.register("approximateLocation")} />
            </div>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Submit report"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
