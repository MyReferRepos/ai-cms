import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// GET /api/posts - List all posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const authorId = searchParams.get('authorId')
  const categoryId = searchParams.get('categoryId')

  const where: any = {}
  if (status) where.status = status
  if (authorId) where.authorId = authorId
  if (categoryId) where.categoryId = categoryId

  const posts = await prisma.post.findMany({
    where,
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
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json(posts)
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN, EDITOR, and AUTHOR can create posts
  if (!['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, excerpt, coverImage, status, categoryId, tags } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    let slug = slugify(title)

    // Ensure slug is unique
    let slugExists = await prisma.post.findUnique({ where: { slug } })
    let counter = 1
    while (slugExists) {
      slug = `${slugify(title)}-${counter}`
      slugExists = await prisma.post.findUnique({ where: { slug } })
      counter++
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorId: session.user.id,
        categoryId: categoryId || null,
        tags: tags ? {
          create: tags.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        } : undefined,
      },
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
