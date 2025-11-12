import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteManyFromS3 } from '@/lib/s3'

// POST /api/media/batch-delete - Delete multiple media files
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      )
    }

    // Limit batch size
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Cannot delete more than 100 items at once' },
        { status: 400 }
      )
    }

    // Get all media records
    const mediaItems = await prisma.media.findMany({
      where: { id: { in: ids } },
    })

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: 'No media found' }, { status: 404 })
    }

    // Check ownership (non-admins can only delete their own uploads)
    if (session.user.role !== 'ADMIN') {
      const unauthorizedItems = mediaItems.filter(
        item => item.uploadedById !== session.user.id
      )

      if (unauthorizedItems.length > 0) {
        return NextResponse.json(
          {
            error: 'You can only delete your own uploads',
            unauthorizedIds: unauthorizedItems.map(item => item.id),
          },
          { status: 403 }
        )
      }
    }

    // Collect all URLs to delete from S3
    const urlsToDelete: string[] = []
    mediaItems.forEach(media => {
      urlsToDelete.push(media.url)
      if (media.thumbnailUrl) urlsToDelete.push(media.thumbnailUrl)
      if (media.mediumUrl) urlsToDelete.push(media.mediumUrl)
    })

    // Delete from S3
    try {
      await deleteManyFromS3(urlsToDelete)
    } catch (error) {
      console.error('Error deleting from S3:', error)
      // Continue to delete from database even if S3 deletion fails
    }

    // Delete from database
    const deleteResult = await prisma.media.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} media items`,
      deletedCount: deleteResult.count,
    })
  } catch (error) {
    console.error('Error batch deleting media:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
