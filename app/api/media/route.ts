import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToStorage, validateStorageConfig } from '@/lib/storage'
import { validateFile, generateUniqueFilename, getFileCategory } from '@/lib/file-validation'
import { optimizeImage, getImageDimensions, getThumbnailFilename, getMediumFilename, isImage } from '@/lib/image-optimization'

// GET /api/media - List all media with optional filtering
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const mimeType = searchParams.get('mimeType')
    const category = searchParams.get('category')
    const uploadedById = searchParams.get('uploadedById')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filtering
    const where: any = {}

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (mimeType) {
      where.mimeType = mimeType
    }

    if (category) {
      // Filter by category (image, video, audio, document)
      const categoryMimeTypes: Record<string, string[]> = {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
        document: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
      }

      if (categoryMimeTypes[category]) {
        where.mimeType = { in: categoryMimeTypes[category] }
      }
    }

    if (uploadedById) {
      where.uploadedById = uploadedById
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.media.count({ where }),
    ])

    return NextResponse.json({
      data: media,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

// POST /api/media - Upload media file to S3
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Validate storage configuration
    const storageValidation = validateStorageConfig()
    if (!storageValidation.valid) {
      console.error('Storage configuration errors:', storageValidation.errors)
      return NextResponse.json(
        {
          error: `${storageValidation.provider} is not configured`,
          details: storageValidation.errors,
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Initialize variables
    let url: string
    let thumbnailUrl: string | null = null
    let mediumUrl: string | null = null
    let width: number | null = null
    let height: number | null = null

    // Optimize images and generate thumbnails
    if (isImage(file.type)) {
      // Get original dimensions
      const dimensions = await getImageDimensions(buffer)
      if (dimensions) {
        width = dimensions.width
        height = dimensions.height
      }

      // Optimize image
      const optimized = await optimizeImage(buffer, file.type, true)

      // Upload original/optimized version
      url = await uploadToStorage(optimized.optimized, filename, file.type)

      // Upload thumbnail if generated
      if (optimized.thumbnail) {
        const thumbFilename = getThumbnailFilename(filename)
        thumbnailUrl = await uploadToStorage(optimized.thumbnail, thumbFilename, file.type)
      }

      // Upload medium size if generated
      if (optimized.medium) {
        const mediumFilename = getMediumFilename(filename)
        mediumUrl = await uploadToStorage(optimized.medium, mediumFilename, file.type)
      }
    } else {
      // Upload non-image files as-is
      url = await uploadToStorage(buffer, filename, file.type)
    }

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        thumbnailUrl,
        mediumUrl,
        width,
        height,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
