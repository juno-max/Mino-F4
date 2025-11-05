'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/auth/signin' })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Signing you out...</p>
      </div>
    </div>
  )
}
