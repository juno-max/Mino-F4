'use client'

import { Button } from '@/components/Button'
import { PlayCircle, Settings, CheckCircle2 } from 'lucide-react'

interface SetupModeHeroProps {
  totalSites: number
  hasGroundTruth: boolean
  hasInstructions: boolean
  onStartTest: () => void
  onSetupGroundTruth: () => void
  onEditInstructions: () => void
}

export function SetupModeHero({
  totalSites,
  hasGroundTruth,
  hasInstructions,
  onStartTest,
  onSetupGroundTruth,
  onEditInstructions,
}: SetupModeHeroProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-fintech-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PlayCircle className="h-7 w-7 text-emerald-500" />
          Ready to Extract Data from {totalSites.toLocaleString()} Sites
        </h2>
      </div>

      {/* 3-Step Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Step 1: Instructions */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-gray-400">1️⃣</span>
            <h3 className="font-semibold text-gray-900">Instructions</h3>
          </div>

          {hasInstructions ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Using campaign instructions</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditInstructions}
                className="w-full"
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Set up extraction instructions</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditInstructions}
                className="w-full"
              >
                Set Up
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Ground Truth */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-gray-400">2️⃣</span>
            <h3 className="font-semibold text-gray-900">Ground Truth</h3>
          </div>

          {hasGroundTruth ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Accuracy tracking enabled</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupGroundTruth}
                className="w-full"
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                <span className="text-lg">⚠️</span>
                <span>Not set up yet</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Would you like to measure accuracy?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetupGroundTruth}
                className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Set Up GT
              </Button>
            </div>
          )}
        </div>

        {/* Step 3: Test Run */}
        <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-emerald-600">3️⃣</span>
            <h3 className="font-semibold text-gray-900">Test Run</h3>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">Run 10 jobs to validate</p>
            <Button
              variant="primary"
              size="sm"
              onClick={onStartTest}
              className="w-full"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start
            </Button>
            <button
              onClick={() => {/* TODO: Advanced setup */}}
              className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
            >
              ⚙ Configure
            </button>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-3">
          <span className="text-blue-600 text-xl">💡</span>
          <div className="text-sm text-blue-900">
            <span className="font-semibold">Tip:</span> We'll start a small test run first to validate your extraction before running all {totalSites.toLocaleString()} sites.
          </div>
        </div>
      </div>

      {/* Quick Start Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onStartTest}
          className="flex-1"
        >
          <PlayCircle className="h-5 w-5 mr-2" />
          Run 10 Test Sites Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {/* TODO: Advanced setup */}}
        >
          <Settings className="h-5 w-5 mr-2" />
          Advanced Setup
        </Button>
      </div>
    </div>
  )
}
