import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createProject } from '../actions'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/projects" className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900">Create New Project</h1>
          <p className="text-sm text-stone-600 mt-1">
            Define your automation workflow with natural language instructions
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Describe what data you want to extract and from where
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createProject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Competitor Pricing Intelligence"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of what this project does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Workflow Instructions *</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  placeholder="Describe in natural language what data to extract. For example:

Go to the pricing page
Extract the following fields:
- Monthly subscription price
- Annual subscription price
- Features included in each tier
- Free trial availability"
                  rows={12}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-stone-500">
                  Use natural language to describe your workflow. Be specific about what fields to extract and any navigation steps required.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Project
                </Button>
                <Link href="/projects" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Examples */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Example: Pricing Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-700 font-mono">
                Navigate to /pricing<br />
                Extract: Monthly price, Annual price, Features list
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Example: Contact Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-700 font-mono">
                Go to /contact or /about<br />
                Extract: Email, Phone, Address, Support hours
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
