import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/facebook/accounts/[id] - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            facebookPosts: true,
          },
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check ownership
    if (account.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Don't send encrypted token
    const safeAccount = {
      id: account.id,
      pageId: account.pageId,
      pageName: account.pageName,
      isActive: account.isActive,
      tokenExpiresAt: account.tokenExpiresAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      postsCount: account._count.facebookPosts,
    }

    return NextResponse.json(safeAccount)
  } catch (error) {
    console.error('Error fetching Facebook account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/facebook/accounts/[id] - Update account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: params.id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check ownership
    if (account.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { isActive, pageName } = body

    const updatedAccount = await prisma.facebookAccount.update({
      where: { id: params.id },
      data: {
        isActive: isActive !== undefined ? isActive : account.isActive,
        pageName: pageName || account.pageName,
      },
    })

    return NextResponse.json({
      id: updatedAccount.id,
      pageId: updatedAccount.pageId,
      pageName: updatedAccount.pageName,
      isActive: updatedAccount.isActive,
      tokenExpiresAt: updatedAccount.tokenExpiresAt,
      updatedAt: updatedAccount.updatedAt,
    })
  } catch (error) {
    console.error('Error updating Facebook account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/facebook/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: params.id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Check ownership
    if (account.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.facebookAccount.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Facebook account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
