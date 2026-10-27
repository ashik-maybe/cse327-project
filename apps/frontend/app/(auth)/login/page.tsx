"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { loginSchema } from "@campbridge/shared"
import type { z } from "zod"
import { FirstAid, ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiError, authApi } from "@/lib/api"

type LoginValues = z.infer<typeof loginSchema>

const DEMO = [
  { label: "Volunteer", email: "volunteer@campbridge.local", password: "demo1234" },
  { label: "Team lead", email: "lead@campbridge.local", password: "lead1234" },
]

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const login = useMutation({
    mutationFn: (values: LoginValues) => authApi.login(values.email, values.password),
    onSuccess: async (data) => {
      queryClient.setQueryData(["auth", "me"], data)
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      router.replace("/dashboard")
    },
  })

  const errorMessage =
    login.error instanceof ApiError
      ? login.error.code === "INVALID_CREDENTIALS"
        ? "Email or password is incorrect."
        : login.error.message
      : login.error
        ? "Could not sign in. Try again."
        : null

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <FirstAid className="size-5 text-primary" aria-hidden />
        </div>
        <CardTitle className="text-xl">Sign in to CampBridge</CardTitle>
        <CardDescription>Coordinate community requests with your team.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => login.mutate(values))}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@campbridge.local"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
            {!login.isPending ? <ArrowRight data-icon="inline-end" aria-hidden /> : null}
          </Button>
        </form>

        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Demo accounts</p>
          <div className="flex gap-2">
            {DEMO.map((demo) => (
              <Button
                key={demo.email}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  form.setValue("email", demo.email)
                  form.setValue("password", demo.password)
                }}
              >
                {demo.label}
              </Button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
