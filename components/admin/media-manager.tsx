'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { Trash2, Edit2, Check, X, Search } from 'lucide-react'

interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl: string | null
  mediumUrl: string | null
  alt: string | null
  width: number | null
  height: number | null
  createdAt: Date
  uploadedBy: {
    id: string
    name: string | null
    email: string
  }
}

interface MediaManagerProps {
  initialMedia: Media[]
}

export default function MediaManager({ initialMedia }: MediaManagerProps) {
  const [media, setMedia] = useState<Media[]>(initialMedia)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAlt, setEditingAlt] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Filter media based on search and category
  const filteredMedia = media.filter(item => {
    const matchesSearch =
      searchQuery === '' ||
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'image' && item.mimeType.startsWith('image/')) ||
      (categoryFilter === 'video' && item.mimeType.startsWith('video/')) ||
      (categoryFilter === 'audio' && item.mimeType.startsWith('audio/')) ||
      (categoryFilter === 'document' && (
        item.mimeType.includes('pdf') ||
        item.mimeType.includes('document') ||
        item.mimeType.includes('text')
      ))

    return matchesSearch && matchesCategory
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const newMedia = await response.json()
      setMedia(prev => [newMedia, ...prev])
      alert('File uploaded successfully!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setMedia(prev => prev.filter(item => item.id !== id))
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (error) {
      alert('Failed to delete file')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`Delete ${selectedItems.size} selected files? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/media/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      })

      if (!response.ok) {
        throw new Error('Batch delete failed')
      }

      setMedia(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      alert('Files deleted successfully!')
    } catch (error) {
      alert('Failed to delete files')
    }
  }

  const handleEditAlt = (item: Media) => {
    setEditingId(item.id)
    setEditingAlt(item.alt || '')
  }

  const handleSaveAlt = async (id: string) => {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: editingAlt }),
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      const updatedMedia = await response.json()
      setMedia(prev =>
        prev.map(item => (item.id === id ? updatedMedia : item))
      )
      setEditingId(null)
    } catch (error) {
      alert('Failed to update alt text')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingAlt('')
  }

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredMedia.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredMedia.map(item => item.id)))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('URL copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Upload and Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <input
            type="file"
            id="file-upload"
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </label>

          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
            >
              Delete Selected ({selectedItems.size})
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Select All */}
      {filteredMedia.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedItems.size === filteredMedia.length}
            onChange={toggleSelectAll}
            className="h-4 w-4"
          />
          <span className="text-sm text-muted-foreground">
            Select All ({filteredMedia.length} files)
          </span>
        </div>
      )}

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {searchQuery || categoryFilter !== 'all'
            ? 'No files match your filters.'
            : 'No media files yet. Upload your first file!'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                selectedItems.has(item.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="h-5 w-5"
                />
              </div>

              {/* Preview */}
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                {item.mimeType.startsWith('image/') ? (
                  <img
                    src={item.thumbnailUrl || item.mediumUrl || item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-sm text-muted-foreground">{item.mimeType}</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-medium truncate" title={item.originalName}>
                  {item.originalName}
                </h3>

                {/* Alt Text Editor */}
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingAlt}
                      onChange={(e) => setEditingAlt(e.target.value)}
                      placeholder="Enter alt text..."
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveAlt(item.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.alt && (
                      <p className="text-xs text-muted-foreground italic">
                        Alt: {item.alt}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Size: {formatFileSize(item.size)}</p>
                      {item.width && item.height && (
                        <p>Dimensions: {item.width} × {item.height}px</p>
                      )}
                      <p>Uploaded: {formatDate(item.createdAt)}</p>
                      <p>By: {item.uploadedBy.name || item.uploadedBy.email}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => copyToClipboard(item.url)}
                      >
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAlt(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
