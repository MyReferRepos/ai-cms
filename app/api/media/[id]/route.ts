import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromStorage } from '@/lib/storage'

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    // Get media record
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Check ownership (non-admins can only delete their own uploads)
    if (session.user.role !== 'ADMIN' && media.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own uploads' },
        { status: 403 }
      )
    }

    // Delete from storage
    try {
      await deleteFromStorage(media.url)

      // Delete thumbnails if they exist
      if (media.thumbnailUrl) {
        await deleteFromStorage(media.thumbnailUrl).catch(err =>
          console.error('Failed to delete thumbnail:', err)
        )
      }

      if (media.mediumUrl) {
        await deleteFromStorage(media.mediumUrl).catch(err =>
          console.error('Failed to delete medium size:', err)
        )
      }
    } catch (error) {
      console.error('Error deleting from storage:', error)
      // Continue to delete from database even if storage deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Media deleted successfully' })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/media/[id] - Update media metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await request.json()

    // Get media record
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Check ownership (non-admins can only update their own uploads)
    if (session.user.role !== 'ADMIN' && media.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own uploads' },
        { status: 403 }
      )
    }

    // Validate and sanitize input
    const updateData: any = {}

    if ('alt' in body) {
      updateData.alt = typeof body.alt === 'string' ? body.alt.substring(0, 500) : null
    }

    // Update in database
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/media/[id] - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    const media = await prisma.media.findUnique({
      where: { id },
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

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
