'use client'

import { useState } from 'react'
import { ImageIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ImagePreview } from './ImagePreview'
import { UrlInput } from './UrlInput'
import { FileUpload } from './FileUpload'
import { AIGeneration } from './AIGeneration'
import { DialogActions } from './DialogActions'

type ImagePickerProps = {
  value?: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  context?: string
}

export function ImagePicker({ 
  value, 
  onChange, 
  label = "Image", 
  placeholder = "Enter image URL or upload/generate", 
  context 
}: ImagePickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(value || '')

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url)
  }

  const generateSmartPrompt = async (): Promise<string> => {
    if (!context) return ''
    
    setPromptLoading(true)
    
    try {
      const imageType = label.toLowerCase().includes('cover') ? 'cover' : 
                       label.toLowerCase().includes('section') ? 'section' : 'general'
      
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          context: context.trim(),
          type: imageType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate prompt')
      }

      const data = await response.json()
      return data.prompt
    } finally {
      setPromptLoading(false)
    }
  }

  const handleSmartGenerate = async () => {
    try {
      const smartPrompt = await generateSmartPrompt()
      setGeneratePrompt(smartPrompt)
    } catch (error) {
      console.error('Prompt generation error:', error)
      alert(`Failed to generate prompt: ${(error as Error).message}`)
    }
  }

  const handleSave = () => {
    onChange(currentUrl)
    setIsDialogOpen(false)
  }

  const handleClear = () => {
    setCurrentUrl('')
    onChange('')
    setIsDialogOpen(false)
  }

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      setCurrentUrl(url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) {
      alert('Please enter a prompt for image generation')
      return
    }

    setGenerateLoading(true)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: generatePrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Image generation failed')
      }

      const { url } = await response.json()
      setCurrentUrl(url)
      setGeneratePrompt('')
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Failed to generate image: ${(error as Error).message}`)
    } finally {
      setGenerateLoading(false)
    }
  }

  const openDialog = () => {
    setCurrentUrl(value || '')
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={openDialog}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select or Generate Image</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <ImagePreview 
                imageUrl={currentUrl}
                label="Preview"
                size="medium"
              />

              <UrlInput
                value={currentUrl}
                onChange={handleUrlChange}
              />

              <FileUpload
                onUpload={handleFileUpload}
                loading={uploadLoading}
              />

              <AIGeneration
                prompt={generatePrompt}
                onPromptChange={setGeneratePrompt}
                onGenerate={handleGenerateImage}
                onSmartGenerate={context ? handleSmartGenerate : undefined}
                generateLoading={generateLoading}
                promptLoading={promptLoading}
                context={context}
              />

              <DialogActions
                onSave={handleSave}
                onClear={handleClear}
                onCancel={() => setIsDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ImagePreview 
        imageUrl={value}
        size="small"
        className="mt-2"
      />
    </div>
  )
}