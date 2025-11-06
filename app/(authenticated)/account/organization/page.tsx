'use client'

import { useState, useEffect } from 'react'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface OrganizationData {
  id: string
  name: string
  slug: string
  plan: string
  maxProjects: number
  maxJobsPerMonth: number
  currentProjectsCount: number
  currentMonthJobsCount: number
  createdAt: Date
  owner: {
    name: string
    email: string
  }
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<OrganizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/account/organization')
      if (!response.ok) throw new Error('Failed to fetch organization')

      const data = await response.json()
      setOrg(data.organization)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Failed to load organization'}</div>
      </div>
    )
  }

  const planColors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800',
  }

  const projectsUsagePercent = (org.currentProjectsCount / org.maxProjects) * 100
  const jobsUsagePercent = (org.currentMonthJobsCount / org.maxJobsPerMonth) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-gray-600">Manage your organization and team settings</p>
        </div>

        {/* Organization Info Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 mr-2 text-blue-600" />
              Organization Details
            </h2>
          </div>
          <div className="px-4 py-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <p className="text-lg font-medium text-gray-900">{org.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {org.slug}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  planColors[org.plan as keyof typeof planColors]
                }`}
              >
                {org.plan}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <p className="text-gray-900">{org.owner.name}</p>
              <p className="text-sm text-gray-500">{org.owner.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p className="text-gray-900">
                {new Date(org.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
              Resource Usage
            </h2>
          </div>
          <div className="px-4 py-3 space-y-4">
            {/* Projects Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Projects</label>
                <span className="text-sm text-gray-600">
                  {org.currentProjectsCount} / {org.maxProjects}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    projectsUsagePercent >= 90
                      ? 'bg-red-600'
                      : projectsUsagePercent >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(projectsUsagePercent, 100)}%` }}
                ></div>
              </div>
              {projectsUsagePercent >= 90 && (
                <p className="text-xs text-red-600 mt-1">
                  You're approaching your project limit. Consider upgrading your plan.
                </p>
              )}
            </div>

            {/* Jobs Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Jobs This Month
                </label>
                <span className="text-sm text-gray-600">
                  {org.currentMonthJobsCount.toLocaleString()} /{' '}
                  {org.maxJobsPerMonth.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    jobsUsagePercent >= 90
                      ? 'bg-red-600'
                      : jobsUsagePercent >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(jobsUsagePercent, 100)}%` }}
                ></div>
              </div>
              {jobsUsagePercent >= 90 && (
                <p className="text-xs text-red-600 mt-1">
                  You're approaching your monthly job limit. Resets on the 1st of next month.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Team Card (Coming Soon) */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2 text-blue-600" />
              Team Members
            </h2>
          </div>
          <div className="px-6 py-6 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Team management coming soon!</p>
            <p className="text-sm text-gray-500">
              Invite team members, manage roles, and collaborate on projects.
            </p>
          </div>
        </div>

        {/* Billing Card (Coming Soon) */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-2 text-blue-600" />
              Billing & Subscription
            </h2>
          </div>
          <div className="px-6 py-6 text-center">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Billing management coming soon!</p>
            <p className="text-sm text-gray-500 mb-6">
              Upgrade your plan, manage payment methods, and view invoices.
            </p>
            {org.plan === 'free' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Ready to scale?</strong>
                </p>
                <p className="text-xs text-blue-700 mb-4">
                  Upgrade to Pro or Enterprise for unlimited projects, priority support, and
                  advanced features.
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  View Plans
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
