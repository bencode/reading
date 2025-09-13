'use client'

import { Cross2Icon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'

type DialogActionsProps = {
  onSave: () => void
  onClear: () => void
  onCancel: () => void
}

export function DialogActions({ onSave, onClear, onCancel }: DialogActionsProps) {
  return (
    <div className="flex justify-between pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
      >
        <Cross2Icon className="w-4 h-4 mr-2" />
        Clear
      </Button>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </div>
  )
}