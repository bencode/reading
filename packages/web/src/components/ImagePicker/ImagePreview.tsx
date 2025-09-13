'use client'

import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type ImagePreviewProps = {
  imageUrl?: string
  label?: string
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function ImagePreview({ imageUrl, label, className = '', size = 'medium' }: ImagePreviewProps) {
  if (!imageUrl) return null

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-full h-48', 
    large: 'w-full h-64'
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none'
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {size === 'small' ? (
        <img
          src={imageUrl}
          alt="Preview"
          className={`${sizeClasses[size]} object-cover rounded border ${className}`}
          onError={handleImageError}
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className={`${sizeClasses[size]} object-cover rounded-lg ${className}`}
                onError={handleImageError}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}