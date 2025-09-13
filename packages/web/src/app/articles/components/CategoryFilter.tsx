'use client'

import { Category } from '@/services/articleService'
import { Button } from '@/components/ui/button'

type CategoryFilterProps = {
  categories: Category[]
  selectedCategory: number | null
  onCategoryClick: (categoryId: number | null, categoryName: string | null) => void
}

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryClick 
}: CategoryFilterProps) {
  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onCategoryClick(null, null)}
        className="rounded-full"
      >
        All Categories
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategoryClick(category.id, category.name)}
          className="rounded-full"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}