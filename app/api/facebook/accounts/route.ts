import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { getUserPages, getLongLivedPageToken, verifyPageToken } from '@/lib/facebook'

// GET /api/facebook/accounts - List all Facebook accounts for current user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accounts = await prisma.facebookAccount.findMany({
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
    const safeAccounts = accounts.map(account => ({
      id: account.id,
      pageId: account.pageId,
      pageName: account.pageName,
      isActive: account.isActive,
      tokenExpiresAt: account.tokenExpiresAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      postsCount: account._count.facebookPosts,
    }))

    return NextResponse.json(safeAccounts)
  } catch (error) {
    console.error('Error fetching Facebook accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/facebook/accounts - Add new Facebook account
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and EDITOR can add Facebook accounts
  if (!['ADMIN', 'EDITOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { pageId, pageName, userAccessToken } = body

    if (!pageId || !pageName || !userAccessToken) {
      return NextResponse.json(
        { error: 'Page ID, page name, and user access token are required' },
        { status: 400 }
      )
    }

    // Check if account already exists
    const existingAccount = await prisma.facebookAccount.findUnique({
      where: { pageId },
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'This Facebook page is already connected' },
        { status: 400 }
      )
    }

    // Get long-lived page access token
    const tokenData = await getLongLivedPageToken(pageId, userAccessToken)

    // Verify the token
    const verification = await verifyPageToken(tokenData.access_token)
    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Invalid page access token' },
        { status: 400 }
      )
    }

    // Encrypt the token before storing
    const encryptedToken = encrypt(tokenData.access_token)

    // Calculate expiration date if provided
    let tokenExpiresAt: Date | null = null
    if (tokenData.expires_in) {
      tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
    } else if (verification.expiresAt) {
      tokenExpiresAt = verification.expiresAt
    }

    // Create the account
    const account = await prisma.facebookAccount.create({
      data: {
        userId: session.user.id,
        pageId,
        pageName,
        pageAccessToken: encryptedToken,
        tokenExpiresAt,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        id: account.id,
        pageId: account.pageId,
        pageName: account.pageName,
        isActive: account.isActive,
        tokenExpiresAt: account.tokenExpiresAt,
        createdAt: account.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding Facebook account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
