'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface FacebookPage {
  id: string
  name: string
  access_token: string
}

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [connecting, setConnecting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setError(errorDescription || 'Facebook authorization failed')
      setLoading(false)
      return
    }

    if (!code) {
      setError('No authorization code received')
      setLoading(false)
      return
    }

    try {
      // Exchange code for access token
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const redirectUri = `${window.location.origin}/admin/facebook/callback`

      // Note: In production, this should be done on the server side for security
      // For now, we'll call our API to handle this
      const tokenResponse = await fetch('/api/facebook/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code')
      }

      const { accessToken } = await tokenResponse.json()

      // Get user's pages
      const pagesResponse = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      })

      if (!pagesResponse.ok) {
        throw new Error('Failed to fetch Facebook pages')
      }

      const { pages: fetchedPages } = await pagesResponse.json()
      setPages(fetchedPages)
      setLoading(false)
    } catch (err) {
      console.error('Error in Facebook callback:', err)
      setError(err instanceof Error ? err.message : 'Failed to process authorization')
      setLoading(false)
    }
  }

  const handleConnectPages = async () => {
    if (selectedPages.size === 0) {
      setError('Please select at least one page to connect')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      // Connect each selected page
      for (const pageId of selectedPages) {
        const page = pages.find(p => p.id === pageId)
        if (!page) continue

        const response = await fetch('/api/facebook/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId: page.id,
            pageName: page.name,
            userAccessToken: page.access_token,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to connect ${page.name}`)
        }
      }

      setSuccess(true)

      // Close window after a short delay
      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (err) {
      console.error('Error connecting pages:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect pages')
    } finally {
      setConnecting(false)
    }
  }

  const togglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId)
    } else {
      newSelected.add(pageId)
    }
    setSelectedPages(newSelected)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Connecting to Facebook...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Connection Failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.close()} className="w-full">
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Successfully Connected!
            </CardTitle>
            <CardDescription>
              Your Facebook pages have been connected. This window will close automatically.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select Facebook Pages</CardTitle>
          <CardDescription>
            Choose which Facebook pages you want to connect to your CMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No Facebook pages found. Make sure you have admin access to at least one Facebook page.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pages.map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.id)}
                      onChange={() => togglePage(page.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleConnectPages}
                disabled={connecting || selectedPages.size === 0}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect ${selectedPages.size} Page${selectedPages.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
