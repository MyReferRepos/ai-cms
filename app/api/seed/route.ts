import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/seed - Seed database with initial data
export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Database already seeded' },
        { status: 400 }
      )
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    })

    // Create editor user
    const editorPassword = await bcrypt.hash('editor123', 10)
    const editor = await prisma.user.create({
      data: {
        email: 'editor@example.com',
        password: editorPassword,
        name: 'Editor User',
        role: 'EDITOR',
      },
    })

    // Create author user
    const authorPassword = await bcrypt.hash('author123', 10)
    const author = await prisma.user.create({
      data: {
        email: 'author@example.com',
        password: authorPassword,
        name: 'Author User',
        role: 'AUTHOR',
      },
    })

    // Create categories
    const categories = await prisma.category.createMany({
      data: [
        { name: 'Technology', slug: 'technology', description: 'Tech related posts' },
        { name: 'Business', slug: 'business', description: 'Business insights' },
        { name: 'Design', slug: 'design', description: 'Design articles' },
      ],
    })

    // Create tags
    const tags = await prisma.tag.createMany({
      data: [
        { name: 'JavaScript', slug: 'javascript' },
        { name: 'React', slug: 'react' },
        { name: 'Node.js', slug: 'nodejs' },
        { name: 'AI', slug: 'ai' },
        { name: 'Machine Learning', slug: 'machine-learning' },
      ],
    })

    // Get category IDs
    const techCategory = await prisma.category.findUnique({
      where: { slug: 'technology' },
    })

    // Create sample post
    if (techCategory) {
      await prisma.post.create({
        data: {
          title: 'Welcome to AI CMS',
          slug: 'welcome-to-ai-cms',
          content: '# Welcome to AI CMS\n\nThis is a fully-featured content management system built with Next.js, Prisma, and Basecoat UI.\n\n## Features\n\n- Multi-user support with role-based access control\n- Rich content editor with markdown support\n- Media management\n- Categories and tags\n- Modern, responsive UI\n\nGet started by logging in with your credentials!',
          excerpt: 'Welcome to our new AI-powered CMS platform',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: admin.id,
          categoryId: techCategory.id,
        },
      })
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      users: {
        admin: { email: 'admin@example.com', password: 'admin123' },
        editor: { email: 'editor@example.com', password: 'editor123' },
        author: { email: 'author@example.com', password: 'author123' },
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
