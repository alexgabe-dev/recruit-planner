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
          "border-[rgb(34_197_94/0.24)] bg-[rgb(34_197_94/0.12)] text-[#86efac] hover:bg-[rgb(34_197_94/0.16)]",
        status === "Időzített" &&
          "border-[rgb(124_58_237/0.24)] bg-[rgb(124_58_237/0.12)] text-[#c4b5fd] hover:bg-[rgb(124_58_237/0.16)]",
        status === "Lejárt" && "border-border bg-muted/60 text-muted-foreground hover:bg-muted",
        className,
      )}
    >
      {status}
    </Badge>
  )
}
