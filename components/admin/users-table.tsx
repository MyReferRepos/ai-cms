'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  image: string | null
  createdAt: Date
  _count: {
    posts: number
  }
}

interface UsersTableProps {
  users: User[]
  currentUserId: string
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account")
      return
    }

    if (!confirm('Are you sure you want to delete this user? All their posts will also be deleted.')) {
      return
    }

    setDeletingId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'EDITOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'AUTHOR':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <th className="pb-3 font-semibold">User</th>
            <th className="pb-3 font-semibold">Email</th>
            <th className="pb-3 font-semibold">Role</th>
            <th className="pb-3 font-semibold">Posts</th>
            <th className="pb-3 font-semibold">Joined</th>
            <th className="pb-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-accent/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name || 'No name'}</p>
                    {user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm">{user.email}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td className="py-4 text-sm">{user._count.posts}</td>
              <td className="py-4 text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-4 text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  disabled={deletingId === user.id || user.id === currentUserId}
                >
                  {deletingId === user.id ? 'Deleting...' : 'Delete'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
