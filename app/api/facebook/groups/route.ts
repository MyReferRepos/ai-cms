import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { getUserGroups, verifyUserToken } from '@/lib/facebook'

// GET /api/facebook/groups - List all Facebook groups for current user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const groups = await prisma.facebookGroup.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            facebookPosts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Don't send encrypted tokens to client
    const safeGroups = groups.map(group => ({
      id: group.id,
      groupId: group.groupId,
      groupName: group.groupName,
      groupDescription: group.groupDescription,
      memberCount: group.memberCount,
      privacy: group.privacy,
      isActive: group.isActive,
      lastPostAt: group.lastPostAt,
      lastPostCheckedAt: group.lastPostCheckedAt,
      tokenExpiresAt: group.tokenExpiresAt,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      postsCount: group._count.facebookPosts,
    }))

    return NextResponse.json(safeGroups)
  } catch (error) {
    console.error('Error fetching Facebook groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/facebook/groups - Add new Facebook group
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and EDITOR can add Facebook groups
  if (!['ADMIN', 'EDITOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { groupId, groupName, groupDescription, memberCount, privacy, userAccessToken } = body

    if (!groupId || !groupName || !userAccessToken) {
      return NextResponse.json(
        { error: 'Group ID, group name, and user access token are required' },
        { status: 400 }
      )
    }

    // Check if group already exists
    const existingGroup = await prisma.facebookGroup.findUnique({
      where: { groupId },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'This Facebook group is already connected' },
        { status: 400 }
      )
    }

    // Verify the token
    const verification = await verifyUserToken(userAccessToken)
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Invalid user access token' },
        { status: 400 }
      )
    }

    // Encrypt the token before storing
    const encryptedToken = encrypt(userAccessToken)

    // Calculate expiration date if provided
    let tokenExpiresAt: Date | null = null
    if (verification.expiresAt) {
      tokenExpiresAt = verification.expiresAt
    }

    // Create the group
    const group = await prisma.facebookGroup.create({
      data: {
        userId: session.user.id,
        groupId,
        groupName,
        groupDescription: groupDescription || null,
        memberCount: memberCount || null,
        privacy: privacy || null,
        userAccessToken: encryptedToken,
        tokenExpiresAt,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        id: group.id,
        groupId: group.groupId,
        groupName: group.groupName,
        groupDescription: group.groupDescription,
        memberCount: group.memberCount,
        privacy: group.privacy,
        isActive: group.isActive,
        tokenExpiresAt: group.tokenExpiresAt,
        createdAt: group.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding Facebook group:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
