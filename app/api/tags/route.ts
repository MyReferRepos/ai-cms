import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// GET /api/tags - List all tags
export async function GET() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return NextResponse.json(tags)
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
