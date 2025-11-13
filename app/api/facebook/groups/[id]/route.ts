import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getLastPostTimeInGroup, verifyUserToken } from '@/lib/facebook'

// GET /api/facebook/groups/[id] - Get group details
export async function GET(
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
      include: {
        _count: {
          select: {
            facebookPosts: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check ownership
    if (group.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Don't send encrypted token
    const safeGroup = {
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
    }

    return NextResponse.json(safeGroup)
  } catch (error) {
    console.error('Error fetching Facebook group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/facebook/groups/[id] - Update group
export async function PATCH(
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

    const body = await request.json()
    const { isActive, groupName } = body

    const updatedGroup = await prisma.facebookGroup.update({
      where: { id: params.id },
      data: {
        isActive: isActive !== undefined ? isActive : group.isActive,
        groupName: groupName || group.groupName,
      },
    })

    return NextResponse.json({
      id: updatedGroup.id,
      groupId: updatedGroup.groupId,
      groupName: updatedGroup.groupName,
      groupDescription: updatedGroup.groupDescription,
      isActive: updatedGroup.isActive,
      tokenExpiresAt: updatedGroup.tokenExpiresAt,
      updatedAt: updatedGroup.updatedAt,
    })
  } catch (error) {
    console.error('Error updating Facebook group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/facebook/groups/[id] - Delete group
export async function DELETE(
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

    await prisma.facebookGroup.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Facebook group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
