/**
 * Facebook Analytics and Best Time Recommendation Engine
 * Analyzes historical post performance to recommend optimal posting times
 */

import {
  PagePost,
  PostInsightsData,
  FansOnlineData,
  BestTimeRecommendation,
  getPagePosts,
  getPostInsightsDetailed,
  getFansOnlineData,
} from './facebook'

// Re-export types for convenience
export type { BestTimeRecommendation }

interface PostPerformance {
  postId: string
  dayOfWeek: number
  hour: number
  engagementRate: number
  reach: number
  totalEngagement: number
}

/**
 * Analyze page performance and generate best time recommendations
 * @param pageId Facebook page ID
 * @param pageAccessToken Page access token
 * @param days Number of days to analyze (default 30, max 90)
 */
export async function analyzeBestPostingTimes(
  pageId: string,
  pageAccessToken: string,
  days: number = 30
): Promise<BestTimeRecommendation[]> {
  try {
    // Calculate since timestamp (X days ago)
    const sinceTimestamp = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)

    // Step 1: Fetch historical posts
    console.log(`Fetching posts from last ${days} days...`)
    const posts = await getPagePosts(pageId, pageAccessToken, 100, sinceTimestamp)

    if (posts.length === 0) {
      console.warn('No posts found for analysis')
      return []
    }

    console.log(`Analyzing ${posts.length} posts...`)

    // Step 2: Fetch insights for each post
    const performances: PostPerformance[] = []

    for (const post of posts) {
      try {
        const insights = await getPostInsightsDetailed(post.id, pageAccessToken)

        // Skip posts with no reach
        if (insights.reach === 0) continue

        // Parse post time
        const postDate = new Date(post.created_time)
        const dayOfWeek = postDate.getDay() // 0 = Sunday, 6 = Saturday
        const hour = postDate.getHours()

        // Calculate engagement rate
        const totalEngagement = insights.likes + insights.comments + insights.shares + insights.reactions
        const engagementRate = insights.reach > 0 ? (totalEngagement / insights.reach) * 100 : 0

        performances.push({
          postId: post.id,
          dayOfWeek,
          hour,
          engagementRate,
          reach: insights.reach,
          totalEngagement,
        })

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error fetching insights for post ${post.id}:`, error)
        // Continue with other posts
      }
    }

    if (performances.length === 0) {
      console.warn('No post performance data available')
      return []
    }

    console.log(`Successfully analyzed ${performances.length} posts`)

    // Step 3: Get fans online data (optional, used as a secondary factor)
    const fansOnlineData = await getFansOnlineData(pageId, pageAccessToken)

    // Step 4: Aggregate data by day and hour
    const timeSlots: Record<string, {
      engagementRates: number[]
      reaches: number[]
      fansOnline: number
    }> = {}

    for (const perf of performances) {
      const key = `${perf.dayOfWeek}-${perf.hour}`

      if (!timeSlots[key]) {
        timeSlots[key] = {
          engagementRates: [],
          reaches: [],
          fansOnline: 0,
        }
      }

      timeSlots[key].engagementRates.push(perf.engagementRate)
      timeSlots[key].reaches.push(perf.reach)

      // Add fans online data if available
      if (fansOnlineData[perf.dayOfWeek]) {
        const hourData = fansOnlineData[perf.dayOfWeek].find(h => h.hour === perf.hour)
        if (hourData) {
          timeSlots[key].fansOnline = hourData.value
        }
      }
    }

    // Step 5: Calculate scores and rank time slots
    const recommendations: BestTimeRecommendation[] = []

    for (const [key, data] of Object.entries(timeSlots)) {
      const [dayStr, hourStr] = key.split('-')
      const dayOfWeek = parseInt(dayStr)
      const hour = parseInt(hourStr)

      // Calculate averages
      const avgEngagementRate = average(data.engagementRates)
      const avgReach = Math.round(average(data.reaches))
      const sampleSize = data.engagementRates.length

      // Calculate composite score (0-100)
      // Factors:
      // - 60%: Average engagement rate (normalized to 0-100)
      // - 30%: Sample size reliability (more data = higher confidence)
      // - 10%: Fans online (bonus if available)

      const engagementScore = Math.min(avgEngagementRate * 10, 100) // Normalize engagement rate
      const sampleScore = Math.min((sampleSize / performances.length) * 100, 100)
      const fansOnlineScore = data.fansOnline > 0 ? Math.min((data.fansOnline / 100) * 100, 100) : 50

      const score = (
        engagementScore * 0.6 +
        sampleScore * 0.3 +
        fansOnlineScore * 0.1
      )

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low'
      if (sampleSize >= 5 && avgEngagementRate > 2) {
        confidence = 'high'
      } else if (sampleSize >= 3 && avgEngagementRate > 1) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }

      recommendations.push({
        dayOfWeek,
        hour,
        score,
        engagementRate: avgEngagementRate,
        avgReach,
        confidence,
      })
    }

    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score)

    // Return top recommendations (at least top 10 or all if less)
    return recommendations.slice(0, Math.min(20, recommendations.length))
  } catch (error) {
    console.error('Error analyzing best posting times:', error)
    throw error
  }
}

/**
 * Get simplified best time recommendations (top 3)
 */
export async function getTopRecommendations(
  pageId: string,
  pageAccessToken: string,
  days: number = 30
): Promise<BestTimeRecommendation[]> {
  const allRecommendations = await analyzeBestPostingTimes(pageId, pageAccessToken, days)

  // Filter for high confidence recommendations first
  const highConfidence = allRecommendations.filter(r => r.confidence === 'high')

  if (highConfidence.length >= 3) {
    return highConfidence.slice(0, 3)
  }

  // If not enough high confidence, include medium confidence
  return allRecommendations.slice(0, 3)
}

/**
 * Check if a given time matches any of the best time recommendations
 * @param recommendations List of best time recommendations
 * @param date Date to check
 * @param threshold How close the time should be (in hours)
 */
export function isRecommendedTime(
  recommendations: BestTimeRecommendation[],
  date: Date,
  threshold: number = 1
): { isRecommended: boolean; recommendation?: BestTimeRecommendation } {
  const dayOfWeek = date.getDay()
  const hour = date.getHours()

  for (const rec of recommendations) {
    if (rec.dayOfWeek === dayOfWeek) {
      // Check if hour is within threshold
      const hourDiff = Math.abs(rec.hour - hour)
      if (hourDiff <= threshold) {
        return { isRecommended: true, recommendation: rec }
      }
    }
  }

  return { isRecommended: false }
}

/**
 * Format day of week number to name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Format hour to 12-hour time
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:00 ${period}`
}

/**
 * Format time range (hour +/- 1)
 */
export function formatTimeRange(hour: number): string {
  const startHour = Math.max(0, hour - 1)
  const endHour = Math.min(23, hour + 1)
  return `${formatHour(startHour)} - ${formatHour(endHour)}`
}

/**
 * Helper function to calculate average
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Get next recommended posting time from now
 */
export function getNextRecommendedTime(
  recommendations: BestTimeRecommendation[]
): { date: Date; recommendation: BestTimeRecommendation } | null {
  if (recommendations.length === 0) return null

  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()

  // Sort recommendations by score
  const sortedRecs = [...recommendations].sort((a, b) => b.score - a.score)

  // Find next best time
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const checkDay = (currentDay + dayOffset) % 7

    for (const rec of sortedRecs) {
      if (rec.dayOfWeek === checkDay) {
        // If same day, must be in the future
        if (dayOffset === 0 && rec.hour <= currentHour) continue

        // Calculate the date
        const nextDate = new Date(now)
        nextDate.setDate(now.getDate() + dayOffset)
        nextDate.setHours(rec.hour, 0, 0, 0)

        return { date: nextDate, recommendation: rec }
      }
    }
  }

  // Fallback to first recommendation
  const rec = sortedRecs[0]
  const nextDate = new Date(now)
  let daysUntil = rec.dayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  nextDate.setDate(now.getDate() + daysUntil)
  nextDate.setHours(rec.hour, 0, 0, 0)

  return { date: nextDate, recommendation: rec }
}
