'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Article } from '@/services/articleService'
import type {
  CollectionSection,
  Collection,
  CollectionFormStatus,
} from '@/services/collections'
import { BasicInfoForm, type CollectionFormData } from './BasicInfoForm'
import { ArticleSectionsList } from './ArticleSectionsList'
import { FormActions } from './FormActions'

type ExtendedCollectionFormData = CollectionFormData & {
  sections: CollectionSection[]
}

type CollectionFormProps = {
  initialData?: Collection
  mode: 'create' | 'edit'
}

export function CollectionForm({ initialData, mode }: CollectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<ExtendedCollectionFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    cover_image: initialData?.cover_image || '',
    status:
      (initialData?.status === 'archived' ? 'draft' : initialData?.status) ||
      'draft',
    sections: initialData?.sections || [],
  })

  const addSection = (article: Article) => {
    const newSection: CollectionSection = {
      id: Date.now(),
      collection_id: initialData?.id || 0,
      article_id: article.id,
      title: '',
      description: '',
      image: '',
      external_url: '',
      order_index: formData.sections.length,
      created_at: new Date().toISOString(),
      tags: article.tags || [],
      tag_names: article.tags?.map((tag) => tag.name) || [],
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
    value: unknown,
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

  const createRequestBody = (
    status: CollectionFormStatus = formData.status,
  ) => ({
    title: formData.title,
    description: formData.description,
    cover_image: formData.cover_image,
    status,
    sections: formData.sections.map((section) => ({
      article_id: section.article_id,
      title: section.title,
      description: section.description,
      image: section.image,
      external_url: section.external_url,
      tag_names: section.tag_names || [],
    })),
  })

  const submitForm = async (status: CollectionFormStatus = formData.status) => {
    const apiUrl =
      mode === 'edit'
        ? `/api/collections/${initialData!.id}`
        : '/api/collections'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createRequestBody(status)),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to ${mode} collection`)
    }

    const savedCollection = await response.json()
    console.log(`Collection ${mode}d:`, savedCollection)
    router.push('/collections')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      await submitForm()
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      await submitForm('published')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const updateBasicInfo = (
    updater: (prev: CollectionFormData) => CollectionFormData,
  ) => {
    setFormData((prev) => {
      const basicInfo = updater({
        title: prev.title,
        description: prev.description,
        cover_image: prev.cover_image,
        status: prev.status,
      })
      return {
        ...prev,
        ...basicInfo,
      }
    })
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
          <BasicInfoForm
            formData={formData}
            setFormData={updateBasicInfo}
            sections={formData.sections}
          />

          <ArticleSectionsList
            sections={formData.sections}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onUpdateSection={updateSection}
          />

          <FormActions
            mode={mode}
            loading={loading}
            canSubmit={!!formData.title.trim()}
            onCancel={handleCancel}
            onPublish={handlePublish}
          />
        </form>
      </div>
    </div>
  )
}
