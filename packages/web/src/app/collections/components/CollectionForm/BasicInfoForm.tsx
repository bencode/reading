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
  const generateCoverImageContext = (): string => {
    if (sections.length === 0) {
      return formData.title || 'Programming weekly collection'
    }

    // Collect article titles (up to 6)
    const articleTitles = sections
      .map(s => s.article?.title)
      .filter(Boolean)
      .slice(0, 6)

    // Collect all tags and get top topics
    const tagCounts: Record<string, number> = {}
    sections.forEach(section => {
      const tags = section.tag_names || section.tags?.map(t => t.name) || []
      tags.forEach(tag => {
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        }
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([name]) => name)

    const parts = [formData.title || '编程技艺周刊']
    if (articleTitles.length > 0) {
      parts.push(`收录文章：${articleTitles.map(t => `'${t}'`).join('、')}`)
    }
    if (topTags.length > 0) {
      parts.push(`主要话题：${topTags.join(', ')}`)
    }
    return parts.join('，')
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
            aspectRatio="landscape"
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