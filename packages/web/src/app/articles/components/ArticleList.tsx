'use client'

import { Article } from '@/services/articleService'
import ArticleCard from './ArticleCard'

type ArticleListProps = {
  articles: Article[]
  isAuthenticated: boolean
  onToggleRead: (articleId: number, currentStatus: boolean) => void
  onToggleStarred: (articleId: number, currentStatus: boolean) => void
  onToggleDeleted: (articleId: number, currentStatus: boolean) => void
  onRateArticle: (articleId: number, rating: number | null) => void
}

export default function ArticleList({
  articles,
  isAuthenticated,
  onToggleRead,
  onToggleStarred,
  onToggleDeleted,
  onRateArticle
}: ArticleListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isAuthenticated={isAuthenticated}
          onToggleRead={onToggleRead}
          onToggleStarred={onToggleStarred}
          onToggleDeleted={onToggleDeleted}
          onRateArticle={onRateArticle}
        />
      ))}
    </div>
  )
}