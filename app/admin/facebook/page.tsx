import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import FacebookAccountManager from '@/components/admin/facebook-account-manager'
import FacebookGroupManager from '@/components/admin/facebook-group-manager'
import FacebookPublisher from '@/components/admin/facebook-publisher'
import FacebookPostsTable from '@/components/admin/facebook-posts-table'

export default async function FacebookPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Only ADMIN, EDITOR, and AUTHOR can access Facebook management
  if (!['ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    redirect('/admin')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Facebook Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your Facebook pages, groups and publish content
        </p>
      </div>

      {/* Facebook Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Facebook Pages</CardTitle>
          <CardDescription>
            Manage your connected Facebook pages and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacebookAccountManager />
        </CardContent>
      </Card>

      {/* Facebook Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Facebook Groups</CardTitle>
          <CardDescription>
            Manage your connected Facebook groups and track last post times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacebookGroupManager />
        </CardContent>
      </Card>

      {/* Publish Content */}
      <Card>
        <CardHeader>
          <CardTitle>Publish to Facebook</CardTitle>
          <CardDescription>
            Share your content to Facebook pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacebookPublisher />
        </CardContent>
      </Card>

      {/* Publishing History */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing History</CardTitle>
          <CardDescription>
            View and manage your Facebook posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacebookPostsTable />
        </CardContent>
      </Card>
    </div>
  )
}
