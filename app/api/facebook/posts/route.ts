import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { publishToFacebook, getPostInsights } from '@/lib/facebook'

// GET /api/facebook/posts - List all Facebook posts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status')
    const postId = searchParams.get('postId')

    const where: any = {}

    // Filter by account ownership
    if (session.user.role !== 'ADMIN') {
      where.facebookAccount = {
        userId: session.user.id,
      }
    }

    if (accountId) where.facebookAccountId = accountId
    if (status) where.status = status
    if (postId) where.postId = postId

    const posts = await prisma.facebookPost.findMany({
      where,
      include: {
        facebookAccount: {
          select: {
            id: true,
            pageId: true,
            pageName: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching Facebook posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/facebook/posts - Publish to Facebook
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN, EDITOR, and AUTHOR can publish
  if (!['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { facebookAccountId, postId, message, link, imageUrl, scheduledAt } = body

    if (!facebookAccountId || !message) {
      return NextResponse.json(
        { error: 'Facebook account ID and message are required' },
        { status: 400 }
      )
    }

    // Get the Facebook account
    const account = await prisma.facebookAccount.findUnique({
      where: { id: facebookAccountId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Facebook account not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (account.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: 'Facebook account is not active' },
        { status: 400 }
      )
    }

    // Decrypt the page access token
    const pageAccessToken = decrypt(account.pageAccessToken)

    // If scheduled, just create the record without publishing
    if (scheduledAt) {
      const scheduledPost = await prisma.facebookPost.create({
        data: {
          facebookAccountId,
          postId: postId || null,
          message,
          link: link || null,
          imageUrl: imageUrl || null,
          scheduledAt: new Date(scheduledAt),
          status: 'PENDING',
        },
        include: {
          facebookAccount: {
            select: {
              id: true,
              pageId: true,
              pageName: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      })

      return NextResponse.json(scheduledPost, { status: 201 })
    }

    // Publish immediately
    try {
      const publishResult = await publishToFacebook({
        pageAccessToken,
        pageId: account.pageId,
        message,
        link,
        imageUrl,
      })

      // Create the record
      const facebookPost = await prisma.facebookPost.create({
        data: {
          facebookAccountId,
          postId: postId || null,
          facebookPostId: publishResult.id,
          message,
          link: link || null,
          imageUrl: imageUrl || null,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        include: {
          facebookAccount: {
            select: {
              id: true,
              pageId: true,
              pageName: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      })

      return NextResponse.json(facebookPost, { status: 201 })
    } catch (publishError) {
      // If publish fails, create a failed record
      const failedPost = await prisma.facebookPost.create({
        data: {
          facebookAccountId,
          postId: postId || null,
          message,
          link: link || null,
          imageUrl: imageUrl || null,
          status: 'FAILED',
          errorMessage: publishError instanceof Error ? publishError.message : 'Unknown error',
        },
      })

      return NextResponse.json(
        {
          error: 'Failed to publish to Facebook',
          details: publishError instanceof Error ? publishError.message : 'Unknown error',
          record: failedPost,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error publishing to Facebook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
