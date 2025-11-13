import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import {
  analyzeBestPostingTimes,
  getTopRecommendations,
  BestTimeRecommendation,
} from '@/lib/facebook-analytics'

// GET /api/facebook/analytics/best-times?pageId=xxx&days=30&topOnly=true
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const pageId = searchParams.get('pageId')
    const days = parseInt(searchParams.get('days') || '30')
    const topOnly = searchParams.get('topOnly') === 'true'

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

    // Check if we have cached results (less than 24 hours old)
    const cacheDuration = 24 * 60 * 60 * 1000 // 24 hours
    const cachedResults = await prisma.facebookBestTime.findMany({
      where: {
        facebookAccountId: facebookAccount.id,
        lastAnalyzedAt: {
          gte: new Date(Date.now() - cacheDuration),
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: topOnly ? 3 : 20,
    })

    // If we have fresh cached results, return them
    if (cachedResults.length > 0) {
      const recommendations: BestTimeRecommendation[] = cachedResults.map((result) => ({
        dayOfWeek: result.dayOfWeek,
        hour: result.hour,
        score: result.score,
        engagementRate: result.avgEngagement,
        avgReach: result.avgReach,
        confidence: result.sampleSize >= 5 ? 'high' : result.sampleSize >= 3 ? 'medium' : 'low',
      }))

      return NextResponse.json({
        recommendations,
        cached: true,
        lastAnalyzed: cachedResults[0].lastAnalyzedAt,
      })
    }

    // No cached results, perform fresh analysis
    const pageAccessToken = decrypt(facebookAccount.pageAccessToken)

    let recommendations: BestTimeRecommendation[]
    if (topOnly) {
      recommendations = await getTopRecommendations(pageId, pageAccessToken, days)
    } else {
      recommendations = await analyzeBestPostingTimes(pageId, pageAccessToken, days)
    }

    // Cache the results
    if (recommendations.length > 0) {
      // Delete old cached results
      await prisma.facebookBestTime.deleteMany({
        where: {
          facebookAccountId: facebookAccount.id,
        },
      })

      // Insert new results
      await prisma.facebookBestTime.createMany({
        data: recommendations.slice(0, 20).map((rec) => ({
          facebookAccountId: facebookAccount.id,
          dayOfWeek: rec.dayOfWeek,
          hour: rec.hour,
          score: rec.score,
          avgEngagement: rec.engagementRate,
          avgReach: rec.avgReach,
          sampleSize: 0, // We don't expose this in the recommendation interface
          lastAnalyzedAt: new Date(),
        })),
      })
    }

    return NextResponse.json({
      recommendations,
      cached: false,
      lastAnalyzed: new Date(),
    })
  } catch (error) {
    console.error('Error analyzing best posting times:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze best posting times',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/facebook/analytics/best-times - Force re-analysis
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pageId, days = 30 } = body

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

    // Perform fresh analysis
    const pageAccessToken = decrypt(facebookAccount.pageAccessToken)
    const recommendations = await analyzeBestPostingTimes(pageId, pageAccessToken, days)

    // Cache the results
    if (recommendations.length > 0) {
      // Delete old cached results
      await prisma.facebookBestTime.deleteMany({
        where: {
          facebookAccountId: facebookAccount.id,
        },
      })

      // Insert new results
      await prisma.facebookBestTime.createMany({
        data: recommendations.slice(0, 20).map((rec) => ({
          facebookAccountId: facebookAccount.id,
          dayOfWeek: rec.dayOfWeek,
          hour: rec.hour,
          score: rec.score,
          avgEngagement: rec.engagementRate,
          avgReach: rec.avgReach,
          sampleSize: 0,
          lastAnalyzedAt: new Date(),
        })),
      })
    }

    return NextResponse.json({
      recommendations,
      lastAnalyzed: new Date(),
      message: 'Analysis completed successfully',
    })
  } catch (error) {
    console.error('Error re-analyzing best posting times:', error)
    return NextResponse.json(
      {
        error: 'Failed to re-analyze best posting times',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
