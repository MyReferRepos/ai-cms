import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateStorageConfig } from '@/lib/storage'
import { checkBucketAccess } from '@/lib/supabase-storage'

/**
 * Diagnostic endpoint to check storage configuration
 * GET /api/media/diagnostic
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Only allow ADMIN to access diagnostics
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: [],
  }

  // Check 1: Environment Variables
  diagnostics.checks.push({
    name: 'Environment Variables',
    status: 'checking',
    details: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'not set',
      S3_ACCESS_KEY_ID: !!process.env.S3_ACCESS_KEY_ID,
    }
  })

  // Check 2: Storage Configuration
  const storageConfig = validateStorageConfig()
  diagnostics.checks.push({
    name: 'Storage Configuration',
    status: storageConfig.valid ? 'pass' : 'fail',
    provider: storageConfig.provider,
    errors: storageConfig.errors,
  })

  // Check 3: Supabase Bucket Access (if using Supabase)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const bucketAccessible = await checkBucketAccess()
      diagnostics.checks.push({
        name: 'Supabase Bucket Access',
        status: bucketAccessible ? 'pass' : 'fail',
        message: bucketAccessible
          ? 'Bucket is accessible'
          : 'Cannot access bucket - check bucket name and RLS policies',
      })
    } catch (error) {
      diagnostics.checks.push({
        name: 'Supabase Bucket Access',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Overall status
  const allPassed = diagnostics.checks.every((check: any) => check.status === 'pass' || check.status === 'checking')
  diagnostics.overallStatus = allPassed ? 'healthy' : 'issues_detected'

  return NextResponse.json(diagnostics, {
    status: allPassed ? 200 : 500
  })
}
