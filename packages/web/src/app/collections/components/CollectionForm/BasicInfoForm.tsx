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
import type { CollectionFormStatus } from '@/services/collectionService'
import ImagePicker from '@/components/ImagePicker'
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
}

export function BasicInfoForm({ formData, setFormData }: BasicInfoFormProps) {
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
  )
}

export type { CollectionFormData }