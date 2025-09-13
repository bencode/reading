'use client'

import { StarIcon, TrashIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'

type FilterState = {
  starred: boolean
  read: boolean
  deleted: boolean
}

type ArticleFiltersProps = {
  filters: FilterState
  onFilterToggle: (filterKey: keyof FilterState) => void
}

export default function ArticleFilters({ filters, onFilterToggle }: ArticleFiltersProps) {
  return (
    <div className="mb-6 flex justify-center gap-2">
      <Button
        variant={filters.starred ? "default" : "outline"}
        onClick={() => onFilterToggle('starred')}
        className="rounded-full flex items-center gap-2"
      >
        <StarIcon className="w-4 h-4" />
        Starred
      </Button>
      <Button
        variant={filters.read ? "default" : "outline"}
        onClick={() => onFilterToggle('read')}
        className="rounded-full"
      >
        Read
      </Button>
      <Button
        variant={filters.deleted ? "default" : "outline"}
        onClick={() => onFilterToggle('deleted')}
        className="rounded-full flex items-center gap-2"
      >
        <TrashIcon className="w-4 h-4" />
        Deleted
      </Button>
    </div>
  )
}

export type { FilterState }