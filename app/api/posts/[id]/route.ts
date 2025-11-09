import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// GET /api/posts/[id] - Get post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check permissions
    const isAuthor = existingPost.authorId === session.user.id
    const isAdminOrEditor = ['ADMIN', 'EDITOR'].includes(session.user.role)

    if (!isAuthor && !isAdminOrEditor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, coverImage, status, categoryId, tags } = body

    const updateData: any = {}

    if (title !== undefined) {
      updateData.title = title
      // Regenerate slug if title changed
      if (title !== existingPost.title) {
        let slug = slugify(title)
        let slugExists = await prisma.post.findFirst({
          where: { slug, NOT: { id: params.id } },
        })
        let counter = 1
        while (slugExists) {
          slug = `${slugify(title)}-${counter}`
          slugExists = await prisma.post.findFirst({
            where: { slug, NOT: { id: params.id } },
          })
          counter++
        }
        updateData.slug = slug
      }
    }

    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (categoryId !== undefined) updateData.categoryId = categoryId

    if (status !== undefined) {
      updateData.status = status
      // Set publishedAt when changing to PUBLISHED
      if (status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date()
      }
    }

    // Handle tags update
    if (tags !== undefined) {
      // Delete existing tags and create new ones
      await prisma.postTag.deleteMany({
        where: { postId: params.id },
      })

      if (tags.length > 0) {
        updateData.tags = {
          create: tags.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        }
      }
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only author or admin can delete
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
