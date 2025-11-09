import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface ArticleCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    publishedAt: Date | null
    author: {
      name: string | null
      email: string
    }
    category: {
      name: string
      slug: string
    } | null
  }
  featured?: boolean
}

export default function ArticleCard({ post, featured = false }: ArticleCardProps) {
  const imageUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop'

  if (featured) {
    return (
      <Link
        href={`/articles/${post.slug}`}
        className="group relative block overflow-hidden rounded-2xl h-[500px]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          {post.category && (
            <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold bg-white/20 backdrop-blur-sm rounded-full">
              {post.category.name}
            </span>
          )}
          <h2 className="text-4xl font-bold mb-3 line-clamp-2">{post.title}</h2>
          {post.excerpt && (
            <p className="text-gray-200 text-lg mb-4 line-clamp-2">{post.excerpt}</p>
          )}
          <div className="flex items-center text-sm text-gray-300">
            <span>{post.author.name || post.author.email}</span>
            <span className="mx-2">•</span>
            <span>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/articles/${post.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        {post.category && (
          <span className="inline-block px-2 py-1 mb-3 text-xs font-semibold text-primary bg-primary/10 rounded">
            {post.category.name}
          </span>
        )}
        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
          <span>{post.author.name || post.author.email}</span>
          <span className="mx-2">•</span>
          <span>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
        </div>
      </div>
    </Link>
  )
}
