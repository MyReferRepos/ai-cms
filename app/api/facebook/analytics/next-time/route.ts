import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNextRecommendedTime, BestTimeRecommendation } from '@/lib/facebook-analytics'

// GET /api/facebook/analytics/next-time?pageId=xxx
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      )
    }

    // Get Facebook account
    const facebookAccount = await prisma.facebookAccount.findFirst({
      where: {
        pageId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!facebookAccount) {
      return NextResponse.json(
        { error: 'Facebook page not found or not active' },
        { status: 404 }
      )
    }

    // Get cached recommendations
    const cachedResults = await prisma.facebookBestTime.findMany({
      where: {
        facebookAccountId: facebookAccount.id,
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    })

    if (cachedResults.length === 0) {
      return NextResponse.json(
        { error: 'No analysis data available. Please run analysis first.' },
        { status: 404 }
      )
    }

    // Convert to recommendations format
    const recommendations: BestTimeRecommendation[] = cachedResults.map((result) => ({
      dayOfWeek: result.dayOfWeek,
      hour: result.hour,
      score: result.score,
      engagementRate: result.avgEngagement,
      avgReach: result.avgReach,
      confidence: result.sampleSize >= 5 ? 'high' : result.sampleSize >= 3 ? 'medium' : 'low',
    }))

    // Get next recommended time
    const nextTime = getNextRecommendedTime(recommendations)

    if (!nextTime) {
      return NextResponse.json(
        { error: 'Could not determine next recommended time' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      nextTime: nextTime.date,
      recommendation: nextTime.recommendation,
    })
  } catch (error) {
    console.error('Error getting next recommended time:', error)
    return NextResponse.json(
      {
        error: 'Failed to get next recommended time',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
