/**
 * NextAuth.js Configuration with Google OAuth
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users } from '@/db/auth-schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  // Note: Can't use adapter with CredentialsProvider + JWT sessions
  // adapter: DrizzleAdapter(db) as any,

  providers: [
    // Development credentials provider (bypasses OAuth for testing)
    CredentialsProvider({
      id: 'dev-login',
      name: 'Development Login',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        try {
          // Find or create dev user
          const existingUsers = await db.select().from(users).where(eq(users.email, credentials.email))
          let user = existingUsers[0]

          if (!user) {
            // Create dev user
            const newUsers = await db.insert(users).values({
              email: credentials.email,
              name: credentials.email.split('@')[0],
              emailVerified: new Date(),
            }).returning()
            user = newUsers[0]
          }

          if (!user) {
            console.error('[AUTH ERROR] Failed to create/find user for:', credentials.email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error: any) {
          console.error('[AUTH ERROR]', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            email: credentials.email,
          })
          return null
        }
      }
    }),
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
    async session({ session, user, token }) {
      if (session.user) {
        // For JWT sessions (credentials provider), use token
        // For database sessions (OAuth), use user
        if (token?.sub) {
          ;(session.user as any).id = token.sub
        } else if (user) {
          ;(session.user as any).id = (user as any).id
        }
      }
      return session
    },

    async jwt({ token, user, account }) {
      // Store user id in token for credentials provider
      if (user) {
        token.sub = user.id
      }
      // Handle organization creation for credentials login
      if (account?.provider === 'dev-login' && user) {
        try {
          const { organizations, organizationMembers } = await import('@/db/auth-schema')

          // Check if user already has an organization
          const existingMembership = await db.query.organizationMembers.findFirst({
            where: (members: any, { eq }: any) => eq(members.userId, user.id),
          })

          if (!existingMembership) {
            const slug = user.email?.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'org'

            const [org] = await db.insert(organizations).values({
              name: `${user.name || user.email}'s Organization`,
              slug: `${slug}-${Date.now()}`,
              ownerId: user.id,
              plan: 'free',
            }).returning()

            await db.insert(organizationMembers).values({
              organizationId: org.id,
              userId: user.id,
              role: 'owner',
              canCreateProjects: true,
              canExecuteJobs: true,
              canManageMembers: true,
              canManageBilling: true,
            })

            console.log('Created organization for dev user:', user.email)
          }
        } catch (error) {
          console.error('Error creating organization:', error)
        }
      }
      return token
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
    strategy: 'jwt', // Use JWT for both credentials and OAuth
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: false, // Disable debug warnings in console
}
