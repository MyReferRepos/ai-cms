'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Item {
  id: string
  name: string
  slug: string
  description?: string | null
  _count: {
    posts: number
  }
}

interface CategoriesManagerProps {
  type: 'category' | 'tag'
  items: Item[]
}

export default function CategoriesManager({ type, items }: CategoriesManagerProps) {
  const router = useRouter()
  const [newItemName, setNewItemName] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    setIsCreating(true)
    try {
      const endpoint = type === 'category' ? '/api/categories' : '/api/tags'
      const body = type === 'category'
        ? { name: newItemName, description: newItemDescription }
        : { name: newItemName }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || `Failed to create ${type}`)
        return
      }

      setNewItemName('')
      setNewItemDescription('')
      router.refresh()
    } catch (error) {
      alert('An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="space-y-3">
        <Input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`New ${type} name`}
          disabled={isCreating}
        />
        {type === 'category' && (
          <textarea
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none text-sm"
            rows={2}
            disabled={isCreating}
          />
        )}
        <Button type="submit" size="sm" className="w-full" disabled={isCreating}>
          {isCreating ? 'Creating...' : `Add ${type}`}
        </Button>
      </form>

      <div className="border-t pt-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {type}s yet
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground ml-4">
                  {item._count.posts} posts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
