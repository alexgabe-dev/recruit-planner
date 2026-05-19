import { cn } from "@/lib/utils"

type KorvoLogoProps = {
  compact?: boolean
  className?: string
}

export function KorvoLogo({ compact = false, className }: KorvoLogoProps) {
  return (
    <img
      src={compact ? "/logo/korvo-mark.png" : "/logo/korvo-logo.png"}
      alt="Korvo"
      width={compact ? 40 : 900}
      height={compact ? 40 : 240}
      className={cn(
        "shrink-0 object-contain",
        compact ? "h-10 w-10" : "h-48 w-auto max-w-[840px] sm:h-56 sm:max-w-[900px] lg:h-60 lg:max-w-full",
        className,
      )}
    />
  )
}
