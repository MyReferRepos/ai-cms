'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import PostCommentsDialog from '@/components/admin/post-comments-dialog'

interface Post {
  id: string
  title: string
  slug: string
  status: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    email: string
  }
  category: {
    name: string
  } | null
  _count: {
    comments: number
    tags: number
  }
}

interface PostsTableProps {
  posts: Post[]
  currentUserId: string
  userRole: string
}

export default function PostsTable({ posts, currentUserId, userRole }: PostsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<{ id: string; title: string } | null>(null)

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setDeletingId(postId)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete post')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const canEdit = (post: Post) => {
    return userRole === 'ADMIN' || userRole === 'EDITOR' || post.author.id === currentUserId
  }

  const canDelete = (post: Post) => {
    return userRole === 'ADMIN' || post.author.id === currentUserId
  }

  const handleViewComments = (post: Post) => {
    setSelectedPost({ id: post.id, title: post.title })
    setCommentsDialogOpen(true)
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet. Create your first post!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <th className="pb-3 font-semibold">Title</th>
            <th className="pb-3 font-semibold">Author</th>
            <th className="pb-3 font-semibold">Category</th>
            <th className="pb-3 font-semibold">Status</th>
            <th className="pb-3 font-semibold">Date</th>
            <th className="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b hover:bg-accent/50">
              <td className="py-4">
                <div>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleViewComments(post)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {post._count.comments} comments
                    </button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{post._count.tags} tags</span>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm">
                {post.author.name || post.author.email}
              </td>
              <td className="py-4 text-sm">
                {post.category ? (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {post.category.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-4 text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    post.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : post.status === 'DRAFT'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}
                >
                  {post.status}
                </span>
              </td>
              <td className="py-4 text-sm text-muted-foreground">
                {formatDate(post.createdAt)}
              </td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  {canEdit(post) && (
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                  {canDelete(post) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                    >
                      {deletingId === post.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 评论弹窗 */}
      {selectedPost && (
        <PostCommentsDialog
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          open={commentsDialogOpen}
          onClose={() => setCommentsDialogOpen(false)}
        />
      )}
    </div>
  )
}
