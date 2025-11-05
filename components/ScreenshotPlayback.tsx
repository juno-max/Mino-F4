'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Maximize, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Screenshot {
  timestamp: string
  title: string
  description: string
  screenshotUrl: string
}

interface ScreenshotPlaybackProps {
  screenshots: Screenshot[]
  autoPlay?: boolean
}

export function ScreenshotPlayback({ screenshots, autoPlay = false }: ScreenshotPlaybackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const currentScreenshot = screenshots[currentIndex]

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      if (currentIndex < screenshots.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        setIsPlaying(false) // Stop at end
      }
    }, 2000) // 2 seconds per frame

    return () => clearTimeout(timer)
  }, [isPlaying, currentIndex, screenshots.length])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault()
          setIsPlaying(p => !p)
          break
        case 'ArrowLeft':
          setCurrentIndex(i => Math.max(0, i - 1))
          setIsPlaying(false)
          break
        case 'ArrowRight':
          setCurrentIndex(i => Math.min(screenshots.length - 1, i + 1))
          setIsPlaying(false)
          break
        case 'f':
          setIsFullscreen(f => !f)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [screenshots.length])

  const previous = () => {
    setCurrentIndex(i => Math.max(0, i - 1))
    setIsPlaying(false)
  }

  const next = () => {
    setCurrentIndex(i => Math.min(screenshots.length - 1, i + 1))
    setIsPlaying(false)
  }

  const togglePlay = () => {
    setIsPlaying(p => !p)
  }

  const download = () => {
    const link = document.createElement('a')
    link.href = currentScreenshot.screenshotUrl
    link.download = `screenshot-${currentIndex + 1}.png`
    link.click()
  }

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <p>No screenshots available</p>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8' : 'relative'}`}>
      {/* Screenshot Display */}
      <div className="mb-4">
        <div className={`relative ${isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-96'} bg-stone-900 rounded-lg overflow-hidden`}>
          <img
            src={currentScreenshot.screenshotUrl}
            alt={currentScreenshot.title}
            className="w-full h-full object-contain"
          />

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={previous}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentIndex < screenshots.length - 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Screenshot Info */}
        <div className={`mt-3 ${isFullscreen ? 'text-white' : 'text-stone-900'}`}>
          <div className="font-medium">{currentScreenshot.title}</div>
          <div className={`text-sm ${isFullscreen ? 'text-stone-300' : 'text-stone-600'}`}>
            {currentScreenshot.description}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previous}
            disabled={currentIndex === 0}
            className={isFullscreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={togglePlay}
            className={isFullscreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={next}
            disabled={currentIndex === screenshots.length - 1}
            className={isFullscreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={screenshots.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(parseInt(e.target.value))
              setIsPlaying(false)
            }}
            className="w-full"
          />
          <div className={`text-xs text-center mt-1 ${isFullscreen ? 'text-stone-300' : 'text-stone-600'}`}>
            {currentIndex + 1} of {screenshots.length}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(f => !f)}
            className={isFullscreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}
          >
            <Maximize className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={download}
            className={isFullscreen ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : ''}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 text-xs text-stone-400 bg-black/50 px-3 py-2 rounded">
          <div>Space: Play/Pause</div>
          <div>←/→: Previous/Next</div>
          <div>F: Fullscreen</div>
        </div>
      )}
    </div>
  )
}
