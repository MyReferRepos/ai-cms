'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt: string | null
  createdAt: Date
  uploadedBy: {
    id: string
    name: string | null
    email: string
  }
}

interface MediaManagerProps {
  media: Media[]
}

export default function MediaManager({ media }: MediaManagerProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

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
        throw new Error('Upload failed')
      }

      router.refresh()
    } catch (error) {
      alert('Failed to upload file')
    } finally {
      setIsUploading(false)
      e.target.value = ''
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
      <div>
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
      </div>

      {media.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No media files yet. Upload your first file!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {item.mimeType.startsWith('image/') ? (
                  <img
                    src={item.url}
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
              <div className="p-4 space-y-2">
                <h3 className="font-medium truncate" title={item.originalName}>
                  {item.originalName}
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Size: {formatFileSize(item.size)}</p>
                  <p>Uploaded: {formatDate(item.createdAt)}</p>
                  <p>By: {item.uploadedBy.name || item.uploadedBy.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(item.url)}
                >
                  Copy URL
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
