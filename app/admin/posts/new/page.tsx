import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PostEditor from '@/components/admin/post-editor'

export default async function NewPostPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">Write and publish your content</p>
      </div>

      <PostEditor categories={categories} tags={tags} />
    </div>
  )
}
