'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Facebook, AlertCircle } from 'lucide-react'

interface FacebookAccount {
  id: string
  pageId: string
  pageName: string
  isActive: boolean
  tokenExpiresAt: string | null
  createdAt: string
  postsCount: number
}

export default function FacebookAccountManager() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectingAccount, setConnectingAccount] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facebook/accounts')

      if (!response.ok) {
        throw new Error('Failed to fetch Facebook accounts')
      }

      const data = await response.json()
      setAccounts(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching accounts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectAccount = async () => {
    try {
      setConnectingAccount(true)
      setError(null)

      // Get the OAuth URL
      const response = await fetch('/api/facebook/auth-url')

      if (!response.ok) {
        throw new Error('Failed to get Facebook authorization URL')
      }

      const { authUrl } = await response.json()

      // Open Facebook OAuth in a popup
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        authUrl,
        'Facebook Login',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Poll for popup close or message
      const checkPopupClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopupClosed)
          setConnectingAccount(false)
          // Refresh accounts after popup closes
          fetchAccounts()
        }
      }, 1000)
    } catch (err) {
      console.error('Error connecting account:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect account')
      setConnectingAccount(false)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this Facebook page?')) {
      return
    }

    try {
      const response = await fetch(`/api/facebook/accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      // Refresh accounts list
      fetchAccounts()
    } catch (err) {
      console.error('Error deleting account:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/facebook/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update account status')
      }

      // Refresh accounts list
      fetchAccounts()
    } catch (err) {
      console.error('Error updating account:', err)
      setError(err instanceof Error ? err.message : 'Failed to update account')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading Facebook accounts...</div>
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
          {accounts.length} connected page{accounts.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={handleConnectAccount}
          disabled={connectingAccount}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          {connectingAccount ? 'Connecting...' : 'Connect Facebook Page'}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Facebook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No Facebook pages connected yet.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Connect your Facebook page to start publishing content.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  account.isActive ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Facebook className={`h-5 w-5 ${
                    account.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">{account.pageName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>ID: {account.pageId}</span>
                    <span>{account.postsCount} post{account.postsCount !== 1 ? 's' : ''}</span>
                    {account.tokenExpiresAt && (
                      <span>
                        Expires: {new Date(account.tokenExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={account.isActive ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => toggleAccountStatus(account.id, account.isActive)}
                >
                  {account.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Setup Instructions</h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Click "Connect Facebook Page" button above</li>
          <li>Sign in to your Facebook account if needed</li>
          <li>Select the Facebook page you want to connect</li>
          <li>Grant the required permissions for posting</li>
          <li>Your page will appear in the list above</li>
        </ol>
      </div>
    </div>
  )
}
