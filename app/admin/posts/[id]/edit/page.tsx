import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PostEditor from '@/components/admin/post-editor'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!post) {
    redirect('/admin/posts')
  }

  // Check permissions
  const canEdit =
    session.user.role === 'ADMIN' ||
    session.user.role === 'EDITOR' ||
    post.authorId === session.user.id

  if (!canEdit) {
    redirect('/admin/posts')
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground mt-2">Update your content</p>
      </div>

      <PostEditor
        post={{
          ...post,
          tags: post.tags.map(pt => pt.tag.id),
        }}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}
