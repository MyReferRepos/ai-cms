import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PublicLayout from '@/components/public/public-layout'
import ArticleCard from '@/components/public/article-card'

export async function generateStaticParams() {
  const tags = await prisma.tag.findMany({
    select: { slug: true },
  })

  return tags.map((tag) => ({
    slug: tag.slug,
  }))
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { slug: params.slug },
    include: {
      posts: {
        where: {
          post: {
            status: 'PUBLISHED',
          },
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  name: true,
                  email: true,
                },
              },
              category: true,
            },
          },
        },
      },
    },
  })

  if (!tag) {
    notFound()
  }

  const posts = tag.posts.map(pt => pt.post)

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold">
              Tag
            </div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-gray-400">#</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {tag.name}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No articles with this tag yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
