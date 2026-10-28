import { WarningCircle, WifiSlash } from "@phosphor-icons/react/dist/ssr"

type StateProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      {label}
    </div>
  )
}

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-6">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-6" role="alert">
      <p className="flex items-center gap-2 font-medium">
        <WarningCircle className="size-4 text-destructive" aria-hidden />
        {title}
      </p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}

export function OfflineBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
      <WifiSlash className="size-3.5" aria-hidden />
      Offline
    </span>
  )
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}
