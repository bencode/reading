'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Article, PaginatedResponse } from '@/services/articleService'
import { PlusIcon } from '@radix-ui/react-icons'

type ArticleSelectorProps = {
  onArticleSelect: (article: Article) => void
}

export default function ArticleSelector({ onArticleSelect }: ArticleSelectorProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [showOnlyStarred, setShowOnlyStarred] = useState(true)

  const fetchArticles = async (page: number = 1, search: string = '', onlyStarred: boolean = true) => {
    setArticlesLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    })
    
    if (onlyStarred) {
      params.set('starred', 'true')
    }
    
    if (search.trim()) {
      params.set('search', search.trim())
    }
    
    const response = await fetch(`/api/articles?${params}`)
    const data: PaginatedResponse<Article> = await response.json()
    setArticles(data.data)
    setTotalPages(data.totalPages)
    setCurrentPage(data.page)
    setArticlesLoading(false)
  }

  useEffect(() => {
    fetchArticles(1, searchTerm, showOnlyStarred)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchArticles(1, searchTerm, showOnlyStarred)
      setCurrentPage(1)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, showOnlyStarred])

  const handleArticleSelect = (article: Article) => {
    onArticleSelect(article)
    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Article
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Article</DialogTitle>
        </DialogHeader>
        
        {/* Search and filter controls */}
        <div className="p-4 border-b space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="article-search">Search articles</Label>
              <Input
                id="article-search"
                placeholder="Search by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="starred-only"
                checked={showOnlyStarred}
                onChange={(e) => setShowOnlyStarred(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="starred-only" className="text-sm whitespace-nowrap">
                ⭐ Starred only
              </Label>
            </div>
          </div>
        </div>
        
        {/* Articles list */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[400px]">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading articles...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">
                {searchTerm 
                  ? `No articles found matching "${searchTerm}"${showOnlyStarred ? ' in starred articles' : ''}.`
                  : showOnlyStarred 
                    ? 'No starred articles found.' 
                    : 'No articles found.'}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent
                    className="p-4"
                    onClick={() => handleArticleSelect(article)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {article.source_name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              article.published_at,
                            ).toLocaleDateString()}
                          </span>
                          {showOnlyStarred && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              ⭐ Starred
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!articlesLoading && totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = currentPage - 1
                  fetchArticles(newPage, searchTerm, showOnlyStarred)
                }}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = currentPage + 1
                  fetchArticles(newPage, searchTerm, showOnlyStarred)
                }}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}