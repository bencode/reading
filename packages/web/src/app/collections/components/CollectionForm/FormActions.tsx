'use client'

import { Button } from '@/components/ui/button'

type FormActionsProps = {
  mode: 'create' | 'edit'
  loading: boolean
  canSubmit: boolean
  onCancel: () => void
  onPublish: () => void
}

export function FormActions({
  mode,
  loading,
  canSubmit,
  onCancel,
  onPublish
}: FormActionsProps) {
  return (
    <div className="flex justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          disabled={!canSubmit || loading}
        >
          {loading
            ? 'Saving...'
            : mode === 'edit'
              ? 'Update Draft'
              : 'Save Draft'}
        </Button>

        <Button
          type="button"
          onClick={onPublish}
          disabled={!canSubmit || loading}
        >
          {loading
            ? 'Publishing...'
            : mode === 'edit'
              ? 'Update & Publish'
              : 'Publish Collection'}
        </Button>
      </div>
    </div>
  )
}