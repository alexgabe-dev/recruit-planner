import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[background-color,border-color,color,box-shadow] [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'border-[rgb(124_58_237/0.24)] bg-[rgb(124_58_237/0.12)] text-[#c4b5fd] [a&]:hover:bg-[rgb(124_58_237/0.18)]',
        secondary:
          'border-border bg-secondary text-muted-foreground [a&]:hover:bg-muted',
        destructive:
          'border-[rgb(239_68_68/0.3)] bg-[rgb(239_68_68/0.12)] text-[#fca5a5] [a&]:hover:bg-[rgb(239_68_68/0.18)] focus-visible:ring-danger/20',
        outline:
          'border-border bg-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
