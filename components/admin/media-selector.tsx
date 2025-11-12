'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search, Upload } from 'lucide-react'

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
}

interface MediaSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  filterType?: 'image' | 'video' | 'audio' | 'document' | 'all'
}

export default function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  filterType = 'all',
}: MediaSelectorProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append('category', filterType)
      }

      const response = await fetch(`/api/media?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const result = await response.json()
      setMedia(result.data || result)
    } catch (error) {
      console.error('Error fetching media:', error)
      alert('Failed to load media')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleSelect = (url: string) => {
    onSelect(url)
    onClose()
  }

  const filteredMedia = media.filter(item =>
    searchQuery === '' ||
    item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.alt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Select Media</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex gap-2 p-4 border-b">
          <input
            type="file"
            id="media-selector-upload"
            onChange={handleUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="media-selector-upload"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload New'}
          </label>

          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No files match your search.'
                  : 'No media files available. Upload your first file!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleSelect(item.url)}
                >
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {item.mimeType.startsWith('image/') ? (
                      <img
                        src={item.thumbnailUrl || item.mediumUrl || item.url}
                        alt={item.alt || item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-3xl mb-1">📄</div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.mimeType}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-sm font-medium truncate" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                      {item.width && item.height && ` • ${item.width}×${item.height}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Click on a file to select it
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
