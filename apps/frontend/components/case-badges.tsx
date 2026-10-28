import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  new: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  referred: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

const URGENCY_STYLES: Record<string, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  referred: "Referred",
  resolved: "Resolved",
}

const URGENCY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.new
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        URGENCY_STYLES[urgency] ?? URGENCY_STYLES.low
      )}
    >
      {URGENCY_LABELS[urgency] ?? urgency}
    </span>
  )
}

export function CategoryLabel({ category }: { category: string }) {
  const label = category === "wash" ? "WASH" : category.charAt(0).toUpperCase() + category.slice(1)
  return <span className="text-xs font-medium text-muted-foreground">{label}</span>
}
