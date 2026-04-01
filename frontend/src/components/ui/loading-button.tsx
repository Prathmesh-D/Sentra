import * as React from "react"
import { Button, buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin h-4 w-4", className)}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Text shown in default state */
  label: string
  /** Text shown while loading */
  loadingLabel?: string
  /** Async click handler — loading state is managed automatically */
  onAsyncClick?: () => Promise<void>
  /** External loading override (if you manage state yourself) */
  isLoading?: boolean
}

function LoadingButton({
  label,
  loadingLabel,
  onAsyncClick,
  isLoading: externalLoading,
  onClick,
  variant,
  size,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const loading = externalLoading ?? internalLoading

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) return
    if (onAsyncClick) {
      setInternalLoading(true)
      try {
        await onAsyncClick()
      } finally {
        setInternalLoading(false)
      }
    } else {
      onClick?.(e)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("min-w-[120px] transition-all duration-150", className)}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          {loadingLabel ?? label}
        </span>
      ) : (
        label
      )}
    </Button>
  )
}

export { LoadingButton, Spinner }
