import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPages } from '@/lib/facebook'

// POST /api/facebook/pages - Get user's Facebook pages
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and EDITOR can connect Facebook accounts
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

    const pages = await getUserPages(accessToken)

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error fetching Facebook pages:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}
