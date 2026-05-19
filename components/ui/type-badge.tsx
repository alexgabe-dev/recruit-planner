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
        type === "kampány" && "border-[rgb(124_58_237/0.24)] bg-[rgb(124_58_237/0.12)] text-[#c4b5fd]",
        type === "post" && "border-[rgb(56_189_248/0.24)] bg-[rgb(56_189_248/0.1)] text-[#7dd3fc]",
        type === "kiemelt post" && "border-[rgb(245_158_11/0.24)] bg-[rgb(245_158_11/0.1)] text-[#fbbf24]",
        type === "Profession" && "border-[rgb(34_197_94/0.24)] bg-[rgb(34_197_94/0.1)] text-[#86efac]",
        className,
      )}
    >
      {type}
    </Badge>
  )
}
