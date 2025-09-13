'use client'

import { useRef } from 'react'
import { UploadIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>
  loading: boolean
  label?: string
}

export function FileUpload({ onUpload, loading, label = "Upload Image" }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    await onUpload(file)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex-1"
        >
          <UploadIcon className="w-4 h-4 mr-2" />
          {loading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Supports JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  )
}