import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import PublicLayout from '@/components/public/public-layout'
import ArticleCard from '@/components/public/article-card'

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      take: pageSize,
      skip,
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
    }),
    prisma.post.count({
      where: { status: 'PUBLISHED' },
    }),
  ])

  const totalPages = Math.ceil(totalPosts / pageSize)

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Articles
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Explore our collection of {totalPosts} {totalPosts === 1 ? 'article' : 'articles'}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No articles published yet. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {page > 1 && (
                    <a
                      href={`/articles?page=${page - 1}`}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Previous
                    </a>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <a
                      key={pageNum}
                      href={`/articles?page=${pageNum}`}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </a>
                  ))}
                  {page < totalPages && (
                    <a
                      href={`/articles?page=${page + 1}`}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
