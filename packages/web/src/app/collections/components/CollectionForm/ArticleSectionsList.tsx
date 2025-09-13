'use client'

import { Article } from '@/services/articleService'
import type { CollectionSection } from '@/services/collectionService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ArticleSelector from '@/components/ArticleSelector'
import { ArticleSection } from './ArticleSection'

type ArticleSectionsListProps = {
  sections: CollectionSection[]
  onAddSection: (article: Article) => void
  onRemoveSection: (index: number) => void
  onUpdateSection: (index: number, field: keyof CollectionSection, value: string) => void
}

export function ArticleSectionsList({
  sections,
  onAddSection,
  onRemoveSection,
  onUpdateSection
}: ArticleSectionsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Articles ({sections.length})</CardTitle>
          <ArticleSelector onArticleSelect={onAddSection} />
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No articles added yet. Click &ldquo;Add Article&rdquo; to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <ArticleSection
                key={section.id}
                section={section}
                index={index}
                onRemove={onRemoveSection}
                onUpdate={onUpdateSection}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}