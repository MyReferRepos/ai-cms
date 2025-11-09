import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFileSync } from 'fs'
import { join } from 'path'

// POST /api/setup - Complete database setup
export async function POST(request: Request) {
  try {
    // Parse request body safely
    let body: any = {}
    try {
      const text = await request.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { secret } = body

    // Simple authentication
    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid setup secret' },
        { status: 401 }
      )
    }

    const steps: any[] = []

    // Step 1: Check if tables exist using raw SQL query
    let needsSetup = false
    try {
      // Use raw SQL to check if tables exist without causing Prisma errors
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `

      const tablesExist = result[0]?.exists || false

      if (tablesExist) {
        // Tables exist, check if there's data
        const userCount = await prisma.user.count()
        if (userCount > 0) {
          return NextResponse.json({
            success: true,
            message: 'Database already initialized',
            steps: [{ step: 'check', status: 'skipped', message: 'Database already has data' }],
          })
        }
        steps.push({ step: 'check', status: 'success', message: 'Tables exist, ready for seeding' })
      } else {
        needsSetup = true
        steps.push({ step: 'check', status: 'pending', message: 'Tables not found, will create schema' })
      }
    } catch (error: any) {
      // If even the schema check fails, definitely need setup
      needsSetup = true
      steps.push({ step: 'check', status: 'pending', message: 'Database needs initialization' })
    }

    // Step 2: Push schema to database (only if needed)
    if (needsSetup) {
      try {
        console.log('Creating database schema...')

        // Read SQL migration file
        const sqlPath = join(process.cwd(), 'prisma', 'schema.sql')
        const sql = readFileSync(sqlPath, 'utf-8')

        // Execute SQL to create tables
        await prisma.$executeRawUnsafe(sql)

        steps.push({
          step: 'schema',
          status: 'success',
          message: 'Database schema created successfully',
        })
      } catch (error: any) {
        console.error('Schema creation error:', error)
        steps.push({
          step: 'schema',
          status: 'error',
          message: error.message || 'Failed to create schema',
        })
        return NextResponse.json({ success: false, steps }, { status: 500 })
      }
    } else {
      steps.push({
        step: 'schema',
        status: 'skipped',
        message: 'Schema already exists, skipping creation',
      })
    }

    // Step 3: Database ready for seeding
    steps.push({
      step: 'ready',
      status: 'success',
      message: 'Database ready! You can now seed the database with demo data.',
    })

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      steps,
      nextStep: 'Click "Seed Database Now" button or visit /api/seed to create demo users',
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Setup failed',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/setup - Show setup instructions
export async function GET() {
  return NextResponse.json({
    message: 'Database Setup API',
    instructions: [
      'This endpoint sets up your database automatically',
      'Steps performed:',
      '1. Check if database is initialized',
      '2. Execute SQL to create database schema (tables, indexes, foreign keys)',
      '3. Ready for seeding',
      '',
      'To run setup, make a POST request:',
      'POST /api/setup',
      'Body: { "secret": "your-setup-secret" }',
      '',
      'Set SETUP_SECRET in your environment variables',
      'After setup, visit /api/seed to create demo users',
    ],
    environment: {
      SETUP_SECRET: process.env.SETUP_SECRET ? 'configured' : 'not configured',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
    },
  })
}
