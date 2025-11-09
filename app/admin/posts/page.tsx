import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PostsTable from '@/components/admin/posts-table'

export default async function PostsPage() {
  const session = await getServerSession(authOptions)

  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: true,
      _count: {
        select: {
          comments: true,
          tags: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-2">Manage your content</p>
        </div>
        {['ADMIN', 'EDITOR', 'AUTHOR'].includes(session?.user?.role || '') && (
          <Link href="/admin/posts/new">
            <Button>Create New Post</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <PostsTable posts={posts} currentUserId={session?.user?.id || ''} userRole={session?.user?.role || 'VIEWER'} />
        </CardContent>
      </Card>
    </div>
  )
}
