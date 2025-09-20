'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CollectionFormStatus, CollectionSection } from '@/services/collections'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { TextAssistant } from '@/components/TextAssistant'
import { ImagePicker } from '@/components/ImagePicker'
import TextOptimizer from '@/components/TextOptimizer'

type CollectionFormData = {
  title: string
  description: string
  cover_image: string
  status: CollectionFormStatus
}

type BasicInfoFormProps = {
  formData: CollectionFormData
  setFormData: (updater: (prev: CollectionFormData) => CollectionFormData) => void
  sections?: CollectionSection[]
}

export function BasicInfoForm({ formData, setFormData, sections = [] }: BasicInfoFormProps) {
  // Generate intelligent context based on section tags and articles
  const generateCoverImageContext = (): string => {
    if (sections.length === 0) {
      return `Programming weekly collection about: ${formData.title || 'various topics'}`
    }

    // Collect all tags and count their frequency
    const tagCounts: Record<string, number> = {}
    sections.forEach(section => {
      const tags = section.tag_names || section.tags?.map(t => t.name) || []
      tags.forEach(tag => {
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        }
      })
    })

    // Get top 5 most frequent tags
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name)

    // Also collect article sources for variety
    const sources = [...new Set(
      sections
        .map(s => s.article?.source_name)
        .filter(Boolean)
        .slice(0, 3)
    )]

    if (topTags.length === 0) {
      return `Programming weekly collection featuring articles from ${sources.join(', ')}`
    }

    return `Programming weekly collection focusing on: ${topTags.join(', ')}${sources.length > 0 ? ` from ${sources.join(', ')}` : ''}`
  }
  return (
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
          <MarkdownEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                description: value,
              }))
            }
            label="Description"
            placeholder="Describe what this collection is about. Supports **markdown** formatting."
            rows={6}
            extra={
              <TextAssistant
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: value,
                  }))
                }
                context={`Collection titled: ${formData.title || 'new collection'}`}
                type="description"
                placeholder="Describe what this collection is about"
              />
            }
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
            context={generateCoverImageContext()}
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
  )
}

export type { CollectionFormData }