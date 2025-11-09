import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// GET /api/categories - List all categories
export async function GET() {
  const categories = await prisma.category.findMany({
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

  return NextResponse.json(categories)
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
