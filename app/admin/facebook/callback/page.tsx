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

interface FacebookGroup {
  id: string
  name: string
  description?: string
  member_count?: number
  privacy?: string
}

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [connecting, setConnecting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState<string>('')

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

      const { accessToken: token } = await tokenResponse.json()
      setAccessToken(token)

      // Get user's pages and groups in parallel
      const [pagesResponse, groupsResponse] = await Promise.all([
        fetch('/api/facebook/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken: token }),
        }),
        fetch('/api/facebook/user-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken: token }),
        }),
      ])

      if (!pagesResponse.ok) {
        throw new Error('Failed to fetch Facebook pages')
      }

      const { pages: fetchedPages } = await pagesResponse.json()
      setPages(fetchedPages)

      // Groups might fail if permissions not granted
      if (groupsResponse.ok) {
        const { groups: fetchedGroups } = await groupsResponse.json()
        setGroups(fetchedGroups)
      } else {
        console.warn('Failed to fetch groups - permissions may not be granted')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in Facebook callback:', err)
      setError(err instanceof Error ? err.message : 'Failed to process authorization')
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (selectedPages.size === 0 && selectedGroups.size === 0) {
      setError('Please select at least one page or group to connect')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      // Connect each selected page
      for (const pageId of Array.from(selectedPages)) {
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

      // Connect each selected group
      for (const groupId of Array.from(selectedGroups)) {
        const group = groups.find(g => g.id === groupId)
        if (!group) continue

        const response = await fetch('/api/facebook/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: group.id,
            groupName: group.name,
            groupDescription: group.description,
            memberCount: group.member_count,
            privacy: group.privacy,
            userAccessToken: accessToken,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to connect ${group.name}`)
        }
      }

      setSuccess(true)

      // Close window after a short delay
      setTimeout(() => {
        window.close()
      }, 2000)
    } catch (err) {
      console.error('Error connecting:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
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

  const toggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroups(newSelected)
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

  const totalSelected = selectedPages.size + selectedGroups.size

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select Facebook Pages & Groups</CardTitle>
          <CardDescription>
            Choose which Facebook pages and groups you want to connect to your CMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pages.length === 0 && groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No Facebook pages or groups found. Make sure you have the required permissions.
            </p>
          ) : (
            <>
              {/* Pages Section */}
              {pages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Pages ({pages.length})</h3>
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
                          <p className="text-xs text-muted-foreground">Page ID: {page.id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups Section */}
              {groups.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Groups ({groups.length})</h3>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{group.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>Group ID: {group.id}</span>
                            {group.privacy && (
                              <span className="px-1.5 py-0.5 bg-muted rounded">{group.privacy}</span>
                            )}
                            {group.member_count && (
                              <span>{group.member_count.toLocaleString()} members</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={connecting || totalSelected === 0}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect ${totalSelected} ${totalSelected === 1 ? 'Item' : 'Items'}`
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
