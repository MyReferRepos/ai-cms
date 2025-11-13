import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getLastPostTimeInGroup, verifyUserToken } from '@/lib/facebook'

// POST /api/facebook/groups/[id]/refresh-last-post - Refresh last post time
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const group = await prisma.facebookGroup.findUnique({
      where: { id: params.id },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check ownership
    if (group.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!group.isActive) {
      return NextResponse.json(
        { error: 'Group is not active' },
        { status: 400 }
      )
    }

    // Decrypt the user access token
    const userAccessToken = decrypt(group.userAccessToken)

    // Verify token is still valid
    const verification = await verifyUserToken(userAccessToken)
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'User access token is invalid or expired' },
        { status: 400 }
      )
    }

    // Get the last post time
    const lastPostTime = await getLastPostTimeInGroup(
      group.groupId,
      verification.userId || '',
      userAccessToken
    )

    // Update the group with the last post time
    const updatedGroup = await prisma.facebookGroup.update({
      where: { id: params.id },
      data: {
        lastPostAt: lastPostTime,
        lastPostCheckedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updatedGroup.id,
      groupId: updatedGroup.groupId,
      groupName: updatedGroup.groupName,
      lastPostAt: updatedGroup.lastPostAt,
      lastPostCheckedAt: updatedGroup.lastPostCheckedAt,
    })
  } catch (error) {
    console.error('Error refreshing last post time:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
