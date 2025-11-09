import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CategoriesManager from '@/components/admin/categories-manager'

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories & Tags</h1>
        <p className="text-muted-foreground mt-2">Organize your content</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriesManager type="category" items={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriesManager type="tag" items={tags} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
