'use client'

/**
 * Global CSV Drop Zone
 * Enables drag-and-drop CSV upload from anywhere on the platform
 * Shows inline quick-start modal for instant extraction
 */

import { useState, useCallback } from 'react'
import { QuickStartModal } from './QuickStartModal'

interface GlobalCSVDropZoneProps {
  children: React.ReactNode
}

export function GlobalCSVDropZone({ children }: GlobalCSVDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [showModal, setShowModal] = useState(false)

  const hasCSVFile = useCallback((e: React.DragEvent) => {
    const items = Array.from(e.dataTransfer.items)
    return items.some(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        return file?.name.toLowerCase().endsWith('.csv')
      }
      return false
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasCSVFile(e)) {
      setIsDragging(true)
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [hasCSVFile])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only hide if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(f => f.name.toLowerCase().endsWith('.csv'))

    if (csvFile) {
      setCsvFile(csvFile)
      setShowModal(true)
    }
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setCsvFile(null)
  }, [])

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-screen relative"
      >
        {children}

        {/* Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl p-12 border-4 border-dashed border-blue-500 max-w-md text-center">
              <div className="text-6xl mb-4">📤</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Drop CSV to Start Extraction
              </h3>
              <p className="text-gray-600">
                We'll analyze your file and start extracting data immediately
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Start Modal */}
      {showModal && csvFile && (
        <QuickStartModal
          file={csvFile}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
