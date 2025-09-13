'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Article } from '@/services/articleService'
import type { CollectionSection, Collection, CollectionFormStatus } from '@/services/collectionService'
import { TrashIcon } from '@radix-ui/react-icons'
import ImagePicker from '@/components/ImagePicker'
import TextOptimizer from '@/components/TextOptimizer'
import ArticleSelector from '@/components/ArticleSelector'

type CollectionFormData = {
  title: string
  description: string
  cover_image: string
  status: CollectionFormStatus
  sections: CollectionSection[]
}

type CollectionFormProps = {
  initialData?: Collection
  mode: 'create' | 'edit'
}

export default function CollectionForm({ initialData, mode }: CollectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<CollectionFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    cover_image: initialData?.cover_image || '',
    status: (initialData?.status === 'archived' ? 'draft' : initialData?.status) || 'draft',
    sections: initialData?.sections || [],
  })

  const addSection = (article: Article) => {
    const newSection: CollectionSection = {
      id: Date.now(), // Temporary ID for frontend
      collection_id: initialData?.id || 0,
      article_id: article.id,
      title: '',
      description: '',
      image: '',
      external_url: '',
      order_index: formData.sections.length,
      created_at: new Date().toISOString(),
      article,
    }

    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  const removeSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }))
  }

  const updateSection = (
    index: number,
    field: keyof CollectionSection,
    value: string,
  ) => {
    const updatedSections = [...formData.sections]
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value,
    }

    setFormData((prev) => ({
      ...prev,
      sections: updatedSections,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)

    const apiUrl =
      mode === 'edit' ? `/api/collections/${initialData!.id}` : '/api/collections'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        cover_image: formData.cover_image,
        status: formData.status,
        sections: formData.sections.map((section) => ({
          article_id: section.article_id,
          title: section.title,
          description: section.description,
          image: section.image,
          external_url: section.external_url,
        })),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to ${mode} collection`)
    }

    const savedCollection = await response.json()
    console.log(`Collection ${mode}d:`, savedCollection)
    router.push('/collections')

    setLoading(false)
  }

  const handlePublish = async () => {
    if (!formData.title.trim()) return

    setLoading(true)

    const apiUrl =
      mode === 'edit' ? `/api/collections/${initialData!.id}` : '/api/collections'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        cover_image: formData.cover_image,
        status: 'published',
        sections: formData.sections.map((section) => ({
          article_id: section.article_id,
          title: section.title,
          description: section.description,
          image: section.image,
          external_url: section.external_url,
        })),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to publish collection`)
    }

    const savedCollection = await response.json()
    console.log('Collection published:', savedCollection)
    router.push('/collections')

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'edit' ? 'Edit Collection' : 'Create New Collection'}
          </h1>
          <p className="text-gray-600">
            {mode === 'edit'
              ? 'Update your curated article collection'
              : 'Create a curated collection of articles'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter collection title"
                  required
                />
              </div>

              <div>
                <TextOptimizer
                  value={formData.description}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: value,
                    }))
                  }
                  label="Description"
                  placeholder="Describe what this collection is about"
                  rows={4}
                  context={`Collection titled: ${formData.title || 'new collection'}`}
                  type="description"
                />
              </div>

              <div>
                <ImagePicker
                  value={formData.cover_image}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, cover_image: url }))
                  }
                  label="Cover Image"
                  placeholder="Add a cover image for this collection"
                  context={`Collection about: ${formData.title || 'various topics'}`}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published') =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Articles ({formData.sections.length})</CardTitle>
                <ArticleSelector onArticleSelect={addSection} />
              </div>
            </CardHeader>
            <CardContent>
              {formData.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No articles added yet. Click &ldquo;Add Article&rdquo; to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.sections.map((section, index) => (
                    <Card
                      key={section.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {section.article?.title || 'Unknown Article'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {section.article?.source_name}
                              </Badge>
                              <span>
                                {section.article?.published_at &&
                                  new Date(
                                    section.article.published_at,
                                  ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor={`section-title-${index}`}>
                              Custom Title
                            </Label>
                            <Input
                              id={`section-title-${index}`}
                              value={section.title || ''}
                              onChange={(e) =>
                                updateSection(index, 'title', e.target.value)
                              }
                              placeholder="Override article title (optional)"
                            />
                          </div>

                          <div>
                            <TextOptimizer
                              value={section.description || ''}
                              onChange={(value) =>
                                updateSection(index, 'description', value)
                              }
                              label="Custom Description"
                              placeholder="Add custom description or commentary"
                              rows={6}
                              context={`Article: ${section.article?.title || 'article'} from ${section.article?.source_name || 'source'}`}
                              type="description"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <ImagePicker
                                value={section.image || ''}
                                onChange={(url) =>
                                  updateSection(index, 'image', url)
                                }
                                label="Section Image"
                                placeholder="Add custom image for this section"
                                context={`Article: ${section.article?.title || 'article'} from ${section.article?.source_name || 'source'}`}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`section-external-${index}`}>
                                External Link URL
                              </Label>
                              <Input
                                id={`section-external-${index}`}
                                value={section.external_url || ''}
                                onChange={(e) =>
                                  updateSection(
                                    index,
                                    'external_url',
                                    e.target.value,
                                  )
                                }
                                placeholder="https://example.com/additional-resource"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Optional: Add a link to additional resources or references for this section
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={!formData.title.trim() || loading}
              >
                {loading
                  ? 'Saving...'
                  : mode === 'edit'
                    ? 'Update Draft'
                    : 'Save Draft'}
              </Button>

              <Button
                type="button"
                onClick={handlePublish}
                disabled={!formData.title.trim() || loading}
              >
                {loading
                  ? 'Publishing...'
                  : mode === 'edit'
                    ? 'Update & Publish'
                    : 'Publish Collection'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}