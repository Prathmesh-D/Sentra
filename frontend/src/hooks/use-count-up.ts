import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `end` over `duration` ms.
 * Returns the current display value as a string.
 * Non-numeric strings (e.g. "..." or "0 MB") are returned as-is.
 */
export function useCountUp(end: string, duration = 800): string {
  // Try to parse a leading number (handles "42", "1.5 GB", "0 MB")
  const match = end.match(/^([\d.]+)(.*)$/)
  const numericEnd = match ? parseFloat(match[1]) : NaN
  const suffix = match ? match[2] : ''
  const isNumeric = !isNaN(numericEnd) && numericEnd > 0

  const [current, setCurrent] = useState(isNumeric ? '0' + suffix : end)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isNumeric) {
      setCurrent(end)
      return
    }

    const isFloat = end.includes('.')
    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = eased * numericEnd

      if (isFloat) {
        setCurrent(val.toFixed(1) + suffix)
      } else {
        setCurrent(Math.round(val) + suffix)
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [end, numericEnd, isNumeric, suffix, duration])

  return current
}
