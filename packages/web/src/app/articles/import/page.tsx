'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

type ArticleData = {
  title: string
  original_url: string
  summary: string
  source_name: string
  published_at: string | null
  category_name?: string
  tag_names?: string[]
}

export default function ImportArticlePage() {
  const { isAuthenticated } = useAuth()
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please authenticate to import articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full">Go to Authentication</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jsonInput.trim()) {
      setError('Please paste the JSON data')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setIsUpdated(false)

    try {
      // Parse JSON
      const articleData: ArticleData = JSON.parse(jsonInput)

      // Validate required fields
      if (!articleData.title || !articleData.original_url || !articleData.summary || !articleData.source_name) {
        setError('Invalid JSON: missing required fields (title, original_url, summary, source_name)')
        setLoading(false)
        return
      }

      // Submit to API
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setIsUpdated(data.updated || false)
        setJsonInput('')
      } else {
        setError(data.error || 'Failed to import article')
      }
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format')
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to Articles
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Import Article</h1>
          <p className="text-gray-600 mt-2">
            Paste the JSON output from the local import script
          </p>
        </div>

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Article JSON Data</CardTitle>
            <CardDescription>
              Run the local script to extract article data, then paste the JSON output here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jsonInput">JSON Data</Label>
                <textarea
                  id="jsonInput"
                  className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                  placeholder='Paste JSON here, e.g.:
{
  "title": "Article Title",
  "original_url": "https://...",
  "summary": "Article summary...",
  "source_name": "manual",
  "published_at": "2024-01-01T00:00:00Z",
  "category_name": "Technology",
  "tag_names": ["tag1", "tag2"]
}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Importing...' : 'Import Article'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ Article {isUpdated ? 'updated' : 'imported'} successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              {error}
            </p>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">How to use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-3">
            <div>
              <p className="font-medium mb-2">Step 1: Install dependencies</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
cd packages/tasks{'\n'}
.venv/bin/pip install playwright{'\n'}
.venv/bin/playwright install chromium
              </pre>
            </div>

            <div>
              <p className="font-medium mb-2">Step 2: Run the local import script</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
.venv/bin/python manual_import.py &quot;https://example.com/article&quot; &quot;manual&quot;
              </pre>
            </div>

            <div>
              <p className="font-medium mb-2">Step 3: Copy the JSON output</p>
              <p>The script will output JSON data. Copy everything between the lines.</p>
            </div>

            <div>
              <p className="font-medium mb-2">Step 4: Paste and submit</p>
              <p>Paste the JSON into the textarea above and click Import Article.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
