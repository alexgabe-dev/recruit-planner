import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Ad } from "@/lib/types"

interface TypeBadgeProps {
  type: Ad["type"]
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        type === "kampány" && "border-[oklch(0.7_0.15_160)] text-[oklch(0.7_0.15_160)]",
        type === "post" && "border-[oklch(0.65_0.18_250)] text-[oklch(0.65_0.18_250)]",
        type === "kiemelt post" && "border-[oklch(0.75_0.15_45)] text-[oklch(0.75_0.15_45)]",
        className,
      )}
    >
      {type}
    </Badge>
  )
}
