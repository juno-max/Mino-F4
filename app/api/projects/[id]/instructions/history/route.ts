import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()

    // TODO: Implement version history from database
    // For now, return placeholder data
    const versions = [
      {
        id: '1',
        version: 3,
        instructions: 'Extract business name, address, phone number, and website URL from each venue page.',
        accuracy: 91,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdBy: user.name || user.email,
      },
      {
        id: '2',
        version: 2,
        instructions: 'Extract business name, address, and phone number from each venue page.',
        accuracy: 85,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdBy: user.name || user.email,
      },
      {
        id: '3',
        version: 1,
        instructions: 'Extract business name and address from each venue page.',
        accuracy: 78,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdBy: user.name || user.email,
      },
    ]

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching instruction history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instruction history' },
      { status: 500 }
    )
  }
}
