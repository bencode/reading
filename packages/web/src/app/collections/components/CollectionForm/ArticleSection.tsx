'use client'

import { TrashIcon } from '@radix-ui/react-icons'

import type { CollectionSection } from '@/services/collectionService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ImagePicker from '@/components/ImagePicker'
import TextOptimizer from '@/components/TextOptimizer'

type ArticleSectionProps = {
  section: CollectionSection
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof CollectionSection, value: string) => void
}

export function ArticleSection({
  section,
  index,
  onRemove,
  onUpdate
}: ArticleSectionProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              {section.article?.title || 'Unknown Article'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="outline" className="text-xs">
                {section.article?.source_name}
              </Badge>
              <span>
                {section.article?.published_at &&
                  new Date(
                    section.article.published_at,
                  ).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor={`section-title-${index}`}>
              Custom Title
            </Label>
            <Input
              id={`section-title-${index}`}
              value={section.title || ''}
              onChange={(e) =>
                onUpdate(index, 'title', e.target.value)
              }
              placeholder="Override article title (optional)"
            />
          </div>

          <div>
            <TextOptimizer
              value={section.description || ''}
              onChange={(value) =>
                onUpdate(index, 'description', value)
              }
              label="Custom Description"
              placeholder="Add custom description or commentary"
              rows={6}
              context={`Article: ${section.article?.title || 'article'} from ${section.article?.source_name || 'source'}`}
              type="description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <ImagePicker
                value={section.image || ''}
                onChange={(url) =>
                  onUpdate(index, 'image', url)
                }
                label="Section Image"
                placeholder="Add custom image for this section"
                context={`Article: ${section.article?.title || 'article'} from ${section.article?.source_name || 'source'}`}
              />
            </div>

            <div>
              <Label htmlFor={`section-external-${index}`}>
                External Link URL
              </Label>
              <Input
                id={`section-external-${index}`}
                value={section.external_url || ''}
                onChange={(e) =>
                  onUpdate(
                    index,
                    'external_url',
                    e.target.value,
                  )
                }
                placeholder="https://example.com/additional-resource"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add a link to additional resources or references for this section
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}