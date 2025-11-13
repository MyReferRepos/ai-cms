import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/facebook/exchange-token - Exchange authorization code for access token
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, redirectUri } = body

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Code and redirect URI are required' },
        { status: 400 }
      )
    }

    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Facebook App credentials are not configured' },
        { status: 500 }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&` +
      `code=${code}`
    )

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      throw new Error(error.error?.message || 'Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({ accessToken: tokenData.access_token })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
