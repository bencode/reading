'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type UrlInputProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function UrlInput({ 
  value, 
  onChange, 
  label = "Image URL", 
  placeholder = "https://example.com/image.jpg" 
}: UrlInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}