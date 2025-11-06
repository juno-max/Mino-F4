'use client'

import { useState, useEffect } from 'react'

type ScrollDirection = 'up' | 'down' | null

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null)
  const [isAtTop, setIsAtTop] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      // Check if we're at the top of the page
      setIsAtTop(scrollY < 50)

      // Only update direction if scroll amount is significant (> 10px)
      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false
        return
      }

      // Determine scroll direction
      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up')
      setLastScrollY(scrollY > 0 ? scrollY : 0)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true })

    // Initialize
    updateScrollDirection()

    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY])

  return { scrollDirection, isAtTop }
}
