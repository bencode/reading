'use client'

import type { FilterState } from './ArticleFilters'

type ArticleStatsProps = {
  articlesCount: number
  total: number
  selectedCategory: number | null
  filters: FilterState
}

export default function ArticleStats({ 
  articlesCount, 
  total, 
  selectedCategory, 
  filters 
}: ArticleStatsProps) {
  const activeFilters = [
    filters.starred && 'starred',
    filters.read && 'read', 
    filters.deleted && 'deleted'
  ].filter(Boolean)

  return (
    <div className="text-center mt-6 text-sm text-gray-600">
      Showing {articlesCount} of {total} articles
      {selectedCategory && ' in selected category'}
      {activeFilters.length > 0 && (
        <span> with filters: {activeFilters.join(', ')}</span>
      )}
    </div>
  )
}