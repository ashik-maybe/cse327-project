import type { ServicePointRecord } from "@/lib/api"

export const SERVICE_CATEGORY_META: Record<string, { label: string; color: string }> = {
  cfm_desk: { label: "CFM desk", color: "#2563eb" },
  health_post: { label: "Health post", color: "#dc2626" },
  shelter_focal_point: { label: "Shelter focal point", color: "#16a34a" },
  wash_point: { label: "WASH point", color: "#0891b2" },
  food_distribution: { label: "Food distribution", color: "#d97706" },
  protection_desk: { label: "Protection desk", color: "#7c3aed" },
}

export function categoryLabel(category: string) {
  return SERVICE_CATEGORY_META[category]?.label ?? category.replaceAll("_", " ")
}

export function categoryColor(category: string) {
  return SERVICE_CATEGORY_META[category]?.color ?? "#64748b"
}

export function directionsUrl(point: Pick<ServicePointRecord, "latitude" | "longitude">) {
  return `https://www.openstreetmap.org/directions?to=${point.latitude},${point.longitude}`
}
