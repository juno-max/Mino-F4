/**
 * NextAuth.js Configuration with Google OAuth
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Auto-create organization for new users
      if (user.email && !user.id) {
        try {
          // This will be handled by the adapter
          return true
        } catch (error) {
          console.error('Error creating user:', error)
          return false
        }
      }
      return true
    },
  },

  events: {
    async createUser({ user }) {
      console.log('New user created:', user.email)

      // Auto-create organization for new user
      try {
        const { organizations, organizationMembers } = await import('@/db/auth-schema')
        const slug = user.email?.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'org'

        const [org] = await db.insert(organizations).values({
          name: `${user.name}'s Organization`,
          slug: `${slug}-${Date.now()}`,
          ownerId: user.id,
          plan: 'free',
        }).returning()

        // Add user as owner member
        await db.insert(organizationMembers).values({
          organizationId: org.id,
          userId: user.id,
          role: 'owner',
          canCreateProjects: true,
          canExecuteJobs: true,
          canManageMembers: true,
          canManageBilling: true,
        })

        console.log('Created organization for user:', user.email)
      } catch (error) {
        console.error('Error creating organization:', error)
      }
    },
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  debug: process.env.NODE_ENV === 'development',
}
