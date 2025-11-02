import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-stone-900">
            MINO
          </h1>
          <p className="text-xl text-stone-600 max-w-lg mx-auto">
            Web automation platform with systematic ground truth validation
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-900 rounded-lg hover:bg-stone-300 transition-colors font-medium"
          >
            Learn More
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
          <div className="p-6 bg-white rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">Use-Case Agnostic</h3>
            <p className="text-sm text-stone-600">
              Works for pricing intelligence, restaurant data, compliance monitoring, or any workflow
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">Ground Truth Testing</h3>
            <p className="text-sm text-stone-600">
              Validate accuracy on sample sites before production with dynamic column metrics
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-2">Iterative Refinement</h3>
            <p className="text-sm text-stone-600">
              Improve from 60% to 95% accuracy through systematic testing and refinement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
