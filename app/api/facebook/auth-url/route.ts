import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/facebook/auth-url - Get Facebook OAuth URL
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and EDITOR can connect Facebook accounts
  if (!['ADMIN', 'EDITOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const appId = process.env.FACEBOOK_APP_ID
  const redirectUri = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/admin/facebook/callback`

  if (!appId) {
    return NextResponse.json(
      { error: 'Facebook App ID is not configured' },
      { status: 500 }
    )
  }

  // Full permissions (will show warning for regular users in development mode)
  // SOLUTION: Use Facebook Test Users to bypass permission restrictions
  // Create test users at: Facebook App Dashboard → Roles → Test Users
  const scope = [
    'email',
    'public_profile',
    'pages_show_list',
    'pages_read_user_content',
    'pages_manage_posts',        // Publishing posts (requires test user or app review)
    'pages_manage_engagement',   // Managing comments (requires test user or app review)
    'read_insights',             // Analytics data (requires test user or app review)
    'groups_access_member_info', // Group info (requires test user or app review)
    'publish_to_groups',         // Publish to groups (requires test user or app review)
  ].join(',')

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${session.user.id}` // Use user ID as state for security

  return NextResponse.json({ authUrl })
}
