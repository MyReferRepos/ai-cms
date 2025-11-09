'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
  const [secret, setSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    if (!secret) {
      setError('Please enter the setup secret')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      })

      const data = await response.json()
      alert('Database seeded successfully! Check the result below.')
      setResult({ ...result, seedResult: data })
    } catch (err: any) {
      alert('Seed failed: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI CMS Database Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Initialize your database automatically
          </p>
        </div>

        {/* Setup Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to initialize your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 Prerequisites</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Supabase PostgreSQL database created</li>
                <li>Environment variables configured in Vercel</li>
                <li>SETUP_SECRET environment variable set</li>
              </ol>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🔑 Environment Variables Required</h3>
              <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                <li>DATABASE_URL</li>
                <li>DIRECT_URL</li>
                <li>SETUP_SECRET (create a random secret)</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">✅ What This Does</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Pushes Prisma schema to your database</li>
                <li>Generates Prisma Client</li>
                <li>Prepares database for seeding</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Setup Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Database Setup</CardTitle>
            <CardDescription>
              Enter your SETUP_SECRET to initialize the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="secret" className="block text-sm font-medium mb-2">
                Setup Secret
              </label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter your SETUP_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This should match the SETUP_SECRET environment variable in Vercel
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : '🚀 Initialize Database'}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {result.success ? '✅ Setup Complete!' : '❌ Setup Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{result.message}</p>

              {result.steps && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Steps Completed:</h3>
                  {result.steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span>
                        {step.status === 'success' ? '✅' :
                         step.status === 'error' ? '❌' :
                         step.status === 'skipped' ? '⏭️' : '⏳'}
                      </span>
                      <div>
                        <p className="font-medium">{step.step}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {step.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.success && result.nextStep && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Next Step:</h3>
                  <p className="text-sm mb-4">{result.nextStep}</p>
                  <Button onClick={handleSeed} disabled={isLoading}>
                    🌱 Seed Database Now
                  </Button>
                </div>
              )}

              {result.seedResult && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Demo Accounts Created:</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <p>Admin: admin@example.com / admin123</p>
                    <p>Editor: editor@example.com / editor123</p>
                    <p>Author: author@example.com / author123</p>
                  </div>
                  <div className="mt-4">
                    <a href="/login" className="text-blue-600 hover:underline">
                      → Go to Login Page
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/"
              className="block p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              🏠 Home
            </a>
            <a
              href="/admin"
              className="block p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              🎛️ Admin Dashboard
            </a>
            <a
              href="/login"
              className="block p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              🔐 Login
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
