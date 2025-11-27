import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AdStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: AdStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "font-medium",
        status === "Aktív" &&
          "bg-[oklch(0.7_0.18_145/0.2)] text-[oklch(0.7_0.18_145)] hover:bg-[oklch(0.7_0.18_145/0.3)]",
        status === "Időzített" &&
          "bg-[oklch(0.65_0.2_250/0.2)] text-[oklch(0.65_0.2_250)] hover:bg-[oklch(0.65_0.2_250/0.3)]",
        status === "Lejárt" && "bg-muted text-muted-foreground hover:bg-muted/80",
        className,
      )}
    >
      {status}
    </Badge>
  )
}
