'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AdminNavProps {
  user: {
    name?: string | null
    email?: string
    role?: string
  }
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard', roles: ['ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'] },
    { href: '/admin/posts', label: 'Posts', roles: ['ADMIN', 'EDITOR', 'AUTHOR'] },
    { href: '/admin/users', label: 'Users', roles: ['ADMIN'] },
    { href: '/admin/categories', label: 'Categories', roles: ['ADMIN', 'EDITOR'] },
    { href: '/admin/media', label: 'Media', roles: ['ADMIN', 'EDITOR', 'AUTHOR'] },
    { href: '/admin/facebook', label: 'Facebook', roles: ['ADMIN', 'EDITOR', 'AUTHOR'] },
  ]

  const visibleNavItems = navItems.filter(item =>
    item.roles.includes(user.role || 'VIEWER')
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="flex items-center">
              <span className="text-2xl font-bold text-primary">AI CMS</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
