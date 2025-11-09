import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PublicLayout from '@/components/public/public-layout'
import ArticleCard from '@/components/public/article-card'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          category: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      },
    },
  })

  if (!category) {
    notFound()
  }

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold">
              Category
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {category.posts.length} {category.posts.length === 1 ? 'article' : 'articles'}
            </p>
          </div>

          {category.posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No articles in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {category.posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
