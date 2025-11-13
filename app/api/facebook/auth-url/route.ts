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

  // Required permissions for managing pages, groups and publishing
  const scope = [
    'pages_show_list',              // View list of pages
    'pages_read_engagement',        // Read page engagement data
    'pages_manage_posts',           // Create, edit and delete posts
    'pages_manage_engagement',      // Manage comments, reactions
    'read_insights',                // Read page insights for analytics
    'groups_access_member_info',    // Access group member info
    'publish_to_groups',            // Publish to groups
  ].join(',')

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${session.user.id}` // Use user ID as state for security

  return NextResponse.json({ authUrl })
}
