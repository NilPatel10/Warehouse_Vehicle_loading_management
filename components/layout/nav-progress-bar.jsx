'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * A lightweight CSS-only top-of-page progress bar that fires on every
 * pathname change (i.e. every Next.js client navigation).
 *
 * No external dependencies needed — it uses a CSS keyframe animation
 * defined inline via a <style> tag so we avoid adding to globals.css.
 */
export function NavProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef(null)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      // Start animation when route changes
      setVisible(true)
      setAnimating(true)

      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current)

      // Hide after a short delay (simulating completion)
      timerRef.current = setTimeout(() => {
        setAnimating(false)
        timerRef.current = setTimeout(() => {
          setVisible(false)
        }, 300)
      }, 500)

      prevPathRef.current = pathname
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes nav-progress {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(-20%); }
          100% { transform: translateX(0%); }
        }
        @keyframes nav-progress-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .nav-bar-run {
          animation: nav-progress 0.5s ease-out forwards;
        }
        .nav-bar-fade {
          animation: nav-progress-fade 0.3s ease-out forwards;
        }
      `}</style>
      <div
        className={`fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden ${animating ? '' : 'nav-bar-fade'}`}
      >
        <div
          className={`h-full w-full bg-primary ${animating ? 'nav-bar-run' : ''}`}
        />
      </div>
    </>
  )
}
