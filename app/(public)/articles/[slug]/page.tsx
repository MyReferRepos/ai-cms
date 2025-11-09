import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PublicLayout from '@/components/public/public-layout'
import MarkdownRenderer from '@/components/public/markdown-renderer'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ArticleCard from '@/components/public/article-card'

export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  // Get related posts
  const relatedPosts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      NOT: { id: post.id },
      OR: [
        { categoryId: post.categoryId },
        {
          tags: {
            some: {
              tagId: {
                in: post.tags.map(pt => pt.tagId),
              },
            },
          },
        },
      ],
    },
    take: 3,
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
  })

  const coverImage = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop'

  return (
    <PublicLayout>
      <article>
        {/* Hero Section */}
        <div className="relative h-[500px] bg-gray-900">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-16">
            <div className="text-white">
              {post.category && (
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="inline-block px-3 py-1 mb-4 text-sm font-semibold bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                >
                  {post.category.name}
                </Link>
              )}
              <h1 className="text-5xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center text-gray-300">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold">
                      {(post.author.name || post.author.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{post.author.name || post.author.email}</p>
                    <p className="text-sm text-gray-400">
                      {post.publishedAt && formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {post.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mb-8">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 border-t">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags:</span>
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Author Bio */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="border-t border-b py-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {(post.author.name || post.author.email)[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{post.author.name || 'Author'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{post.author.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <ArticleCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </PublicLayout>
  )
}
