import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getPostInsights, deleteFacebookPost } from '@/lib/facebook'

// GET /api/facebook/posts/[id] - Get post details with insights
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const facebookPost = await prisma.facebookPost.findUnique({
      where: { id: params.id },
      include: {
        facebookAccount: {
          select: {
            id: true,
            pageId: true,
            pageName: true,
            userId: true,
            pageAccessToken: true,
          },
        },
        facebookGroup: {
          select: {
            id: true,
            groupId: true,
            groupName: true,
            userId: true,
            userAccessToken: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            excerpt: true,
          },
        },
      },
    })

    if (!facebookPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check ownership
    const ownerId = facebookPost.facebookAccount?.userId || facebookPost.facebookGroup?.userId
    if (
      ownerId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to fetch latest insights if post is published
    if (facebookPost.status === 'PUBLISHED' && facebookPost.facebookPostId && facebookPost.facebookAccount) {
      try {
        const pageAccessToken = decrypt(facebookPost.facebookAccount.pageAccessToken)
        const insights = await getPostInsights(
          facebookPost.facebookPostId,
          pageAccessToken
        )

        // Update the insights in database
        await prisma.facebookPost.update({
          where: { id: params.id },
          data: {
            likes: insights.likes,
            shares: insights.shares,
            comments: insights.comments,
            reach: insights.reach,
          },
        })

        // Return updated data
        const response = {
          ...facebookPost,
          likes: insights.likes,
          shares: insights.shares,
          comments: insights.comments,
          reach: insights.reach,
          facebookAccount: facebookPost.facebookAccount ? {
            id: facebookPost.facebookAccount.id,
            pageId: facebookPost.facebookAccount.pageId,
            pageName: facebookPost.facebookAccount.pageName,
          } : null,
          facebookGroup: facebookPost.facebookGroup ? {
            id: facebookPost.facebookGroup.id,
            groupId: facebookPost.facebookGroup.groupId,
            groupName: facebookPost.facebookGroup.groupName,
          } : null,
        }

        return NextResponse.json(response)
      } catch (error) {
        console.error('Error fetching insights:', error)
        // Return data without updated insights
      }
    }

    // Remove sensitive data
    const response = {
      ...facebookPost,
      facebookAccount: facebookPost.facebookAccount ? {
        id: facebookPost.facebookAccount.id,
        pageId: facebookPost.facebookAccount.pageId,
        pageName: facebookPost.facebookAccount.pageName,
      } : null,
      facebookGroup: facebookPost.facebookGroup ? {
        id: facebookPost.facebookGroup.id,
        groupId: facebookPost.facebookGroup.groupId,
        groupName: facebookPost.facebookGroup.groupName,
      } : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching Facebook post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/facebook/posts/[id] - Delete Facebook post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const facebookPost = await prisma.facebookPost.findUnique({
      where: { id: params.id },
      include: {
        facebookAccount: {
          select: {
            userId: true,
            pageAccessToken: true,
          },
        },
        facebookGroup: {
          select: {
            userId: true,
            userAccessToken: true,
          },
        },
      },
    })

    if (!facebookPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check ownership
    const ownerId = facebookPost.facebookAccount?.userId || facebookPost.facebookGroup?.userId
    if (
      ownerId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to delete from Facebook if it was published
    if (facebookPost.status === 'PUBLISHED' && facebookPost.facebookPostId && facebookPost.facebookAccount) {
      try {
        const pageAccessToken = decrypt(facebookPost.facebookAccount.pageAccessToken)
        await deleteFacebookPost(facebookPost.facebookPostId, pageAccessToken)
      } catch (error) {
        console.error('Error deleting from Facebook:', error)
        // Continue to delete from our database even if Facebook delete fails
      }
    }

    // Delete from our database
    await prisma.facebookPost.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Facebook post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
