import { useCallback, useRef, useState } from 'react'

/**
 * Returns a callback-ref to attach to an element and a boolean `isVisible`
 * that becomes true once the element enters the viewport.
 * Uses IntersectionObserver with a configurable threshold.
 * Once revealed, stays visible (no re-hide).
 *
 * Uses a callback ref so it works even when the target element
 * is conditionally rendered (mounted after the hook first runs).
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15
): [React.RefCallback<T>, boolean] {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: T | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      if (!node || isVisible) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(node)
          }
        },
        { threshold }
      )

      observer.observe(node)
      observerRef.current = observer
    },
    [threshold, isVisible]
  )

  return [ref, isVisible]
}
