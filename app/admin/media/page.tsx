import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MediaManager from '@/components/admin/media-manager'

export default async function MediaPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  const media = await prisma.media.findMany({
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
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-2">Manage your media files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Media ({media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaManager initialMedia={media} />
        </CardContent>
      </Card>
    </div>
  )
}
