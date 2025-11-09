'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface Post {
  id?: string
  title: string
  content: string
  excerpt?: string | null
  coverImage?: string | null
  status: string
  categoryId?: string | null
  tags?: string[]
}

interface PostEditorProps {
  post?: Post
  categories: Category[]
  tags: Tag[]
}

export default function PostEditor({ post, categories, tags }: PostEditorProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    coverImage: post?.coverImage || '',
    status: post?.status || 'DRAFT',
    categoryId: post?.categoryId || '',
    tags: post?.tags || [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        status: status || formData.status,
        categoryId: formData.categoryId || null,
      }

      const url = post?.id ? `/api/posts/${post.id}` : '/api/posts'
      const method = post?.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save post')
      }

      router.push('/admin/posts')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId],
    }))
  }

  return (
    <form className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary of the post"
              className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content * (Markdown supported)
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your post content in markdown..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none font-mono text-sm"
              rows={15}
              required
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium mb-2">
              Cover Image URL
            </label>
            <Input
              id="coverImage"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.tags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'DRAFT')}
          variant="outline"
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'PUBLISHED')}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Publish'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
