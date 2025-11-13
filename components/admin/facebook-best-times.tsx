'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Clock, AlertCircle, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BestTimeRecommendation {
  dayOfWeek: number
  hour: number
  score: number
  engagementRate: number
  avgReach: number
  confidence: 'high' | 'medium' | 'low'
}

interface BestTimesData {
  recommendations: BestTimeRecommendation[]
  cached: boolean
  lastAnalyzed: string
}

interface FacebookBestTimesProps {
  pageId: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:00 ${period}`
}

function formatTimeRange(hour: number): string {
  const startHour = Math.max(0, hour - 1)
  const endHour = Math.min(23, hour + 1)
  return `${formatHour(startHour)} - ${formatHour(endHour)}`
}

export default function FacebookBestTimes({ pageId }: FacebookBestTimesProps) {
  const [data, setData] = useState<BestTimesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBestTimes()
  }, [pageId])

  const fetchBestTimes = async (topOnly: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/facebook/analytics/best-times?pageId=${pageId}&topOnly=${topOnly}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch best times')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching best times:', err)
      setError(err instanceof Error ? err.message : 'Failed to load best times')
    } finally {
      setLoading(false)
    }
  }

  const handleReanalyze = async () => {
    try {
      setAnalyzing(true)
      setError(null)

      const response = await fetch('/api/facebook/analytics/best-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          days: 30,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to re-analyze')
      }

      const result = await response.json()
      setData({
        recommendations: result.recommendations,
        cached: false,
        lastAnalyzed: result.lastAnalyzed,
      })
    } catch (err) {
      console.error('Error re-analyzing:', err)
      setError(err instanceof Error ? err.message : 'Failed to re-analyze')
    } finally {
      setAnalyzing(false)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const styles = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }

    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[confidence as keyof typeof styles]}`}>
        {confidence.toUpperCase()}
      </span>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading best times...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          This feature requires at least 30 days of post history to generate recommendations.
        </p>
      </div>
    )
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">
          No data available yet.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Publish at least 10 posts over 30 days to get recommendations.
        </p>
        <Button onClick={handleReanalyze} disabled={analyzing}>
          {analyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Analyze Now
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Best Times to Post
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Based on your last 30 days of post performance
            {data.lastAnalyzed && (
              <span className="ml-2">
                • Last analyzed {formatDistanceToNow(new Date(data.lastAnalyzed), { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReanalyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </>
          )}
        </Button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-3">
        {data.recommendations.slice(0, 5).map((rec, index) => (
          <div
            key={`${rec.dayOfWeek}-${rec.hour}`}
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Rank Badge */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                  index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  'bg-muted text-muted-foreground'
                }`}>
                  #{index + 1}
                </div>

                {/* Time Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{DAYS[rec.dayOfWeek]}</span>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span className="font-medium">{formatTimeRange(rec.hour)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Engagement: {rec.engagementRate.toFixed(2)}%</span>
                    <span>•</span>
                    <span>Avg Reach: {rec.avgReach.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Score and Confidence */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                    {rec.score.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div>
                  {getConfidenceBadge(rec.confidence)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {data.recommendations.length > 5 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchBestTimes(false)}
        >
          View All {data.recommendations.length} Recommendations
        </Button>
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Understanding the Scores</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Score</strong> - Composite score based on engagement rate (60%), sample size (30%), and fan activity (10%)</li>
          <li><strong>High Confidence</strong> - Based on 5+ posts with &gt;2% engagement rate</li>
          <li><strong>Medium Confidence</strong> - Based on 3-4 posts with &gt;1% engagement rate</li>
          <li><strong>Low Confidence</strong> - Based on limited data, use with caution</li>
          <li><strong>Time Range</strong> - Suggested posting window (±1 hour from optimal time)</li>
        </ul>
      </div>
    </div>
  )
}
