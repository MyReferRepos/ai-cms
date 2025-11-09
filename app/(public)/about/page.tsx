import PublicLayout from '@/components/public/public-layout'
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About AI CMS
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              A modern, feature-rich content management system built with cutting-edge
              web technologies to empower creators and developers.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                To provide a powerful, user-friendly content management system that
                makes it easy for anyone to create, manage, and publish beautiful
                content on the web. We believe in empowering creators with the best
                tools available.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Technology</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS, AI CMS
                leverages the latest web technologies to deliver exceptional
                performance, security, and developer experience.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '👥',
                  title: 'Multi-User Support',
                  description: 'Role-based access control with Admin, Editor, Author, and Viewer roles',
                },
                {
                  icon: '📝',
                  title: 'Rich Content Editor',
                  description: 'Markdown support with live preview for beautiful content creation',
                },
                {
                  icon: '🎨',
                  title: 'Beautiful UI',
                  description: 'Modern, responsive design that works perfectly on all devices',
                },
                {
                  icon: '🔒',
                  title: 'Secure Authentication',
                  description: 'Built-in authentication with NextAuth.js for robust security',
                },
                {
                  icon: '📁',
                  title: 'Media Management',
                  description: 'Upload and manage images and files with an intuitive interface',
                },
                {
                  icon: '🚀',
                  title: 'Performance',
                  description: 'Optimized for speed with server-side rendering and static generation',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-20">
            <h2 className="text-3xl font-bold text-center mb-8">Technology Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                'Next.js 14',
                'TypeScript',
                'Prisma ORM',
                'PostgreSQL',
                'NextAuth.js',
                'Tailwind CSS',
                'React',
                'Vercel',
              ].map((tech, index) => (
                <div
                  key={index}
                  className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg font-semibold"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join us and start creating amazing content today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/articles">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
                  Browse Articles
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
