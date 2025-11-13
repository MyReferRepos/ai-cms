'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Send, Loader2 } from 'lucide-react'

interface FacebookAccount {
  id: string
  pageId: string
  pageName: string
  isActive: boolean
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
}

export default function FacebookPublisher() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedPost, setSelectedPost] = useState('')
  const [message, setMessage] = useState('')
  const [includeLink, setIncludeLink] = useState(true)
  const [includeImage, setIncludeImage] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
    fetchPosts()
  }, [])

  useEffect(() => {
    // Auto-populate message when post is selected
    if (selectedPost) {
      const post = posts.find(p => p.id === selectedPost)
      if (post) {
        const excerpt = post.excerpt || ''
        const defaultMessage = `${post.title}\n\n${excerpt}`
        setMessage(defaultMessage)
      }
    }
  }, [selectedPost, posts])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook/accounts')
      if (response.ok) {
        const data = await response.json()
        const activeAccounts = data.filter((acc: FacebookAccount) => acc.isActive)
        setAccounts(activeAccounts)
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=PUBLISHED')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedAccount) {
      setError('Please select a Facebook page')
      return
    }

    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    try {
      setLoading(true)

      const post = selectedPost ? posts.find(p => p.id === selectedPost) : null
      const appUrl = window.location.origin

      const requestBody: any = {
        facebookAccountId: selectedAccount,
        message: message.trim(),
      }

      if (selectedPost) {
        requestBody.postId = selectedPost
      }

      if (post && includeLink) {
        requestBody.link = `${appUrl}/articles/${post.slug}`
      }

      if (post && includeImage && post.coverImage) {
        requestBody.imageUrl = post.coverImage
      }

      const response = await fetch('/api/facebook/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish to Facebook')
      }

      setSuccess('Successfully published to Facebook!')

      // Reset form
      setSelectedPost('')
      setMessage('')
      setIncludeLink(true)
      setIncludeImage(true)

      // Trigger a refresh of the posts table
      window.dispatchEvent(new CustomEvent('facebook-post-published'))
    } catch (err) {
      console.error('Error publishing to Facebook:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish to Facebook')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          <span className="text-sm">{success}</span>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No active Facebook pages connected. Please connect a Facebook page first.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Facebook Page
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a Facebook page</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.pageName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Post (Optional)
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a post or write custom message</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full min-h-[150px] px-3 py-2 border border-input rounded-md bg-background text-sm"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} characters
            </p>
          </div>

          {selectedPost && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeLink}
                  onChange={(e) => setIncludeLink(e.target.checked)}
                  className="rounded"
                />
                Include link to article
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="rounded"
                  disabled={!posts.find(p => p.id === selectedPost)?.coverImage}
                />
                Include cover image
                {!posts.find(p => p.id === selectedPost)?.coverImage && (
                  <span className="text-xs text-muted-foreground">(no image available)</span>
                )}
              </label>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish to Facebook
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
