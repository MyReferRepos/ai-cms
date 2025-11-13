import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserGroups } from '@/lib/facebook'

// POST /api/facebook/user-groups - Get user's Facebook groups
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and EDITOR can connect Facebook groups
  if (!['ADMIN', 'EDITOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    const groups = await getUserGroups(accessToken)

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error fetching Facebook groups:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}
