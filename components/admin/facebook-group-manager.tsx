'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw, Users, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FacebookGroup {
  id: string
  groupId: string
  groupName: string
  groupDescription: string | null
  memberCount: number | null
  privacy: string | null
  isActive: boolean
  lastPostAt: string | null
  lastPostCheckedAt: string | null
  tokenExpiresAt: string | null
  createdAt: string
  postsCount: number
}

export default function FacebookGroupManager() {
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshingGroupId, setRefreshingGroupId] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facebook/groups')

      if (!response.ok) {
        throw new Error('Failed to fetch Facebook groups')
      }

      const data = await response.json()
      setGroups(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching groups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshLastPost = async (groupId: string) => {
    try {
      setRefreshingGroupId(groupId)
      setError(null)

      const response = await fetch(`/api/facebook/groups/${groupId}/refresh-last-post`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to refresh last post time')
      }

      // Refresh groups list
      await fetchGroups()
    } catch (err) {
      console.error('Error refreshing last post:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh last post time')
    } finally {
      setRefreshingGroupId(null)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to disconnect this Facebook group?')) {
      return
    }

    try {
      const response = await fetch(`/api/facebook/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete group')
      }

      // Refresh groups list
      fetchGroups()
    } catch (err) {
      console.error('Error deleting group:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }

  const toggleGroupStatus = async (groupId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/facebook/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update group status')
      }

      // Refresh groups list
      fetchGroups()
    } catch (err) {
      console.error('Error updating group:', err)
      setError(err instanceof Error ? err.message : 'Failed to update group')
    }
  }

  const getPrivacyBadge = (privacy: string | null) => {
    if (!privacy) return null

    const privacyStyles = {
      PUBLIC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      CLOSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      SECRET: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    return (
      <span className={`px-2 py-1 text-xs rounded ${privacyStyles[privacy as keyof typeof privacyStyles] || 'bg-gray-100 text-gray-800'}`}>
        {privacy}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading Facebook groups...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {groups.length} connected group{groups.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={fetchGroups}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No Facebook groups connected yet.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Connect to Facebook to access your groups. Make sure you have the required permissions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-full ${
                    group.isActive ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Users className={`h-5 w-5 ${
                      group.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{group.groupName}</h3>
                      {getPrivacyBadge(group.privacy)}
                    </div>

                    {group.groupDescription && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {group.groupDescription}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {group.memberCount && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.memberCount.toLocaleString()} members
                        </span>
                      )}
                      <span>{group.postsCount} post{group.postsCount !== 1 ? 's' : ''}</span>

                      {group.lastPostAt ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                          <Clock className="h-3 w-3" />
                          Last posted: {formatDistanceToNow(new Date(group.lastPostAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Clock className="h-3 w-3" />
                          No posts yet
                        </span>
                      )}

                      {group.lastPostCheckedAt && (
                        <span className="text-xs">
                          (checked {formatDistanceToNow(new Date(group.lastPostCheckedAt), { addSuffix: true })})
                        </span>
                      )}
                    </div>

                    {group.tokenExpiresAt && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Token expires: {new Date(group.tokenExpiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefreshLastPost(group.id)}
                    disabled={refreshingGroupId === group.id}
                  >
                    {refreshingGroupId === group.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant={group.isActive ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleGroupStatus(group.id, group.isActive)}
                  >
                    {group.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-semibold mb-2">About Facebook Groups</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Groups are automatically connected when you authorize Facebook access</li>
          <li>Click the refresh icon to update the last post time for a group</li>
          <li>Last post time helps you track when you last engaged with each group</li>
          <li>Requires <code className="bg-background px-1 py-0.5 rounded">groups_access_member_info</code> and <code className="bg-background px-1 py-0.5 rounded">publish_to_groups</code> permissions</li>
          <li>These permissions may require Facebook App Review</li>
        </ul>
      </div>
    </div>
  )
}
