import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

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
        console.log('Pushing schema to database...')
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
        steps.push({
          step: 'schema',
          status: 'success',
          message: 'Schema pushed successfully',
          output: stdout,
        })
        if (stderr) {
          console.error('Schema push stderr:', stderr)
        }
      } catch (error: any) {
        steps.push({
          step: 'schema',
          status: 'error',
          message: error.message,
          output: error.stdout || '',
          errorOutput: error.stderr || '',
        })
        return NextResponse.json({ success: false, steps }, { status: 500 })
      }

      // Step 3: Generate Prisma Client
      try {
        console.log('Generating Prisma Client...')
        const { stdout } = await execAsync('npx prisma generate')
        steps.push({
          step: 'generate',
          status: 'success',
          message: 'Prisma Client generated',
          output: stdout,
        })
      } catch (error: any) {
        steps.push({
          step: 'generate',
          status: 'error',
          message: error.message,
        })
        return NextResponse.json({ success: false, steps }, { status: 500 })
      }
    } else {
      steps.push({
        step: 'schema',
        status: 'skipped',
        message: 'Schema already exists, skipping push',
      })
    }

    // Step 4: Seed database (automatically via seed API)
    steps.push({
      step: 'ready',
      status: 'success',
      message: 'Database ready! Now visit /api/seed to create demo users.',
    })

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      steps,
      nextStep: 'Visit /api/seed to create demo users',
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
      '2. Push Prisma schema to database',
      '3. Generate Prisma Client',
      '4. Ready for seeding',
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
