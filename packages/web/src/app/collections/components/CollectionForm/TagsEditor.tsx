'use client'

import { useState } from 'react'
import { Cross1Icon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
type TagsEditorProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  label?: string
}

export function TagsEditor({ tags, onChange, label = "Tags" }: TagsEditorProps) {
  const [newTagName, setNewTagName] = useState('')

  const handleAddTag = () => {
    const trimmedName = newTagName.trim()
    if (!trimmedName) return

    // Check if tag already exists
    if (tags.map(tag => tag.toLowerCase()).includes(trimmedName.toLowerCase())) {
      setNewTagName('')
      return
    }

    const updatedTagNames = [...tags, trimmedName]
    onChange(updatedTagNames)
    setNewTagName('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTagNames = tags.filter(tag => tag !== tagToRemove)
    onChange(updatedTagNames)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div>
      <Label htmlFor="tags-input">{label}</Label>

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 mt-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-sm">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                onClick={() => handleRemoveTag(tag)}
              >
                <Cross1Icon className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add New Tag */}
      <div className="flex gap-2">
        <Input
          id="tags-input"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTag}
          disabled={!newTagName.trim()}
        >
          Add
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Press Enter or click Add to add a new tag. Click × to remove tags.
      </p>
    </div>
  )
}