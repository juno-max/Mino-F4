import { NextResponse } from 'next/server'
import { db, projects } from '@/db'
import { eq } from 'drizzle-orm'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Update project instructions
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()

    const body = await request.json()
    const { instructions } = body

    if (!instructions || typeof instructions !== 'string') {
      return NextResponse.json(
        { error: 'Invalid instructions' },
        { status: 400 }
      )
    }

    // Update project
    await db
      .update(projects)
      .set({
        instructions,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, params.id))

    // TODO: Create version history entry

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating instructions:', error)
    return NextResponse.json(
      { error: 'Failed to update instructions' },
      { status: 500 }
    )
  }
}
