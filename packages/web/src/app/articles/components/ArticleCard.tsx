'use client'

import { StarIcon, StarFilledIcon, TrashIcon } from '@radix-ui/react-icons'

import { Article } from '@/services/articleService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ArticleCardProps = {
  article: Article
  isAuthenticated: boolean
  onToggleRead: (articleId: number, currentStatus: boolean) => void
  onToggleStarred: (articleId: number, currentStatus: boolean) => void
  onToggleDeleted: (articleId: number, currentStatus: boolean) => void
  onRateArticle: (articleId: number, rating: number | null) => void
}

export default function ArticleCard({
  article,
  isAuthenticated,
  onToggleRead,
  onToggleStarred,
  onToggleDeleted,
  onRateArticle
}: ArticleCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg leading-tight">
            {article.title}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {!article.is_read && (
              <Badge variant="secondary">New</Badge>
            )}
            {isAuthenticated && (article.deleted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleDeleted(article.id, article.deleted)}
                className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50"
                title="Restore article"
              >
                ↻
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleDeleted(article.id, article.deleted)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50"
                title="Delete article"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 text-sm text-gray-600 mb-2">
          <Badge variant="outline">{article.source_name}</Badge>
          <span>•</span>
          <span>{new Date(article.published_at).toLocaleDateString()}</span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag.id} variant="default" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-gray-700 mb-4 flex-1 leading-relaxed">{article.summary}</p>
        
        {isAuthenticated && article.rating !== null && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-sm text-gray-600">Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <StarFilledIcon
                key={star}
                className={`w-4 h-4 cursor-pointer ${
                  star <= article.rating! ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => onRateArticle(article.id, star)}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRateArticle(article.id, null)}
              className="ml-2 text-xs text-gray-500 h-6 px-2"
            >
              Clear
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Original
              </a>
            </Button>
            
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleStarred(article.id, article.starred)}
                className="p-2"
              >
                {article.starred ? (
                  <StarFilledIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                  <StarIcon className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            )}
            
            {isAuthenticated && article.rating === null && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className="w-4 h-4 cursor-pointer text-gray-300 hover:text-yellow-400"
                    onClick={() => onRateArticle(article.id, star)}
                  />
                ))}
              </div>
            )}
          </div>

          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onToggleRead(article.id, article.is_read)}
              className={article.is_read ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-700"}
            >
              {article.is_read ? "Mark as Unread" : "Mark as Read"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}