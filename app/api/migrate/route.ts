import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// POST /api/migrate - Run database migrations
export async function POST() {
  try {
    // Check if we're in a safe environment
    const apiSecret = process.env.MIGRATION_SECRET

    if (!apiSecret) {
      return NextResponse.json(
        { error: 'Migration endpoint not configured. Set MIGRATION_SECRET environment variable.' },
        { status: 500 }
      )
    }

    console.log('Starting database migration...')

    // Run Prisma migrations
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy')

    console.log('Migration stdout:', stdout)
    if (stderr) {
      console.error('Migration stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully',
      output: stdout,
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error.message,
        output: error.stdout || '',
        errorOutput: error.stderr || '',
      },
      { status: 500 }
    )
  }
}

// GET /api/migrate - Check migration status
export async function GET() {
  try {
    const { stdout } = await execAsync('npx prisma migrate status')

    return NextResponse.json({
      status: 'ok',
      output: stdout,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'pending',
      output: error.stdout || '',
      error: error.message,
    })
  }
}
