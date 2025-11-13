'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink, RefreshCw, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface FacebookPost {
  id: string
  facebookPostId: string | null
  message: string
  status: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DELETED'
  publishedAt: string | null
  scheduledAt: string | null
  likes: number | null
  shares: number | null
  comments: number | null
  errorMessage: string | null
  createdAt: string
  facebookAccount: {
    id: string
    pageId: string
    pageName: string
  }
  post: {
    id: string
    title: string
    slug: string
  } | null
}

export default function FacebookPostsTable() {
  const [posts, setPosts] = useState<FacebookPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()

    // Listen for new posts
    const handleNewPost = () => {
      fetchPosts()
    }

    window.addEventListener('facebook-post-published', handleNewPost)

    return () => {
      window.removeEventListener('facebook-post-published', handleNewPost)
    }
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facebook/posts')

      if (!response.ok) {
        throw new Error('Failed to fetch Facebook posts')
      }

      const data = await response.json()
      setPosts(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshInsights = async (postId: string) => {
    try {
      const response = await fetch(`/api/facebook/posts/${postId}`)

      if (!response.ok) {
        throw new Error('Failed to refresh insights')
      }

      // Refresh the posts list
      fetchPosts()
    } catch (err) {
      console.error('Error refreshing insights:', err)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this Facebook post? This will also delete it from Facebook if it was published.')) {
      return
    }

    try {
      const response = await fetch(`/api/facebook/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Refresh the posts list
      fetchPosts()
    } catch (err) {
      console.error('Error deleting post:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }

    return (
      <span className={`px-2 py-1 text-xs rounded ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading Facebook posts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          No Facebook posts yet.
        </p>
        <p className="text-xs text-muted-foreground">
          Publish your first post using the form above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={fetchPosts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(post.status)}
                  <span className="text-xs text-muted-foreground">
                    {post.facebookAccount.pageName}
                  </span>
                  {post.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-sm mb-2 line-clamp-2">{post.message}</p>

                {post.post && (
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/admin/posts/${post.post.id}/edit`}
                      className="text-xs text-primary hover:underline"
                    >
                      {post.post.title}
                    </Link>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                )}

                {post.status === 'PUBLISHED' && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {post.likes || 0} likes
                    </span>
                    <span>{post.shares || 0} shares</span>
                    <span>{post.comments || 0} comments</span>
                    {post.facebookPostId && (
                      <a
                        href={`https://www.facebook.com/${post.facebookPostId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View on Facebook
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {post.status === 'FAILED' && post.errorMessage && (
                  <p className="text-xs text-destructive mt-2">
                    Error: {post.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {post.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshInsights(post.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
