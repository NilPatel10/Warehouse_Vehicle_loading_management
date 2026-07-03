import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type, onWheel, suppressHydrationWarning = true, ...props }, ref) => {
  // Prevent accidental value changes when scrolling over a focused number input
  // (common problem on laptop trackpads and scroll wheels).
  const handleWheel = type === 'number'
    ? (e) => {
        e.target.blur()
        if (onWheel) onWheel(e)
      }
    : onWheel

  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      onWheel={handleWheel}
      suppressHydrationWarning={suppressHydrationWarning}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
