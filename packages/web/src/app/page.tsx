'use client';

import { Article, Category, Tag, PaginatedResponse } from '../services/articleService';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarIcon, StarFilledIcon, TrashIcon } from '@radix-ui/react-icons';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'starred' | 'deleted'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchArticles = async (categoryId?: number, page: number = 1, mode: 'all' | 'starred' | 'deleted' = 'all') => {
    const params = new URLSearchParams();
    if (categoryId) {
      params.set('categoryId', categoryId.toString());
    }
    
    // Set filter based on view mode
    if (mode === 'starred') {
      params.set('starred', 'true');
    } else if (mode === 'deleted') {
      params.set('deleted', 'true');
    }
    
    params.set('page', page.toString());
    params.set('limit', '12');
    
    const response = await fetch(`/api/articles?${params}`);
    const data: PaginatedResponse<Article> = await response.json();
    setArticles(data.data);
    setTotalPages(data.totalPages);
    setTotal(data.total);
    setCurrentPage(data.page);
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchCategories();
      
      const categoryParam = searchParams.get('category');
      let initialCategoryId: number | null = null;
      if (categoryParam) {
        const response = await fetch('/api/categories');
        const allCategories = await response.json();
        const foundCategory = allCategories.find((cat: Category) => cat.name === categoryParam);
        if (foundCategory) {
          initialCategoryId = foundCategory.id;
        }
      }
      setSelectedCategory(initialCategoryId);

      await fetchArticles(initialCategoryId || undefined, 1, 'all');
    };
    fetchInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (selectedCategory !== null || selectedCategory === null) {
      setCurrentPage(1);
      fetchArticles(selectedCategory || undefined, 1, viewMode);
    }
  }, [selectedCategory, viewMode]);

  const handleCategoryClick = (categoryId: number | null, categoryName: string | null) => {
    setSelectedCategory(categoryId);
    setViewMode('all'); // Reset to 'all' when selecting a category
    const params = new URLSearchParams(searchParams.toString());
    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  };

  const handleViewModeClick = (mode: 'all' | 'starred' | 'deleted') => {
    setViewMode(mode);
    setSelectedCategory(null); // Reset category when changing view mode
  };

  const handlePageChange = (page: number) => {
    fetchArticles(selectedCategory || undefined, page, viewMode);
  };

  const handleToggleReadStatus = async (articleId: number, currentStatus: boolean) => {
    // Optimistic update - update UI immediately
    const newStatus = !currentStatus;
    setArticles(articles.map(article => 
      article.id === articleId 
        ? { ...article, is_read: newStatus }
        : article
    ));

    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'toggle_read' }),
    });

    if (!response.ok) {
      // Revert optimistic update on error
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, is_read: currentStatus }
          : article
      ));
    }
  };

  const handleToggleStarred = async (articleId: number, currentStatus: boolean) => {
    // Optimistic update
    const newStatus = !currentStatus;
    if (!newStatus && viewMode === 'starred') {
      // If unstarring and in starred view, remove from view
      setArticles(articles.filter(article => article.id !== articleId));
    } else {
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, starred: newStatus }
          : article
      ));
    }

    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'toggle_starred' }),
    });

    if (!response.ok) {
      // Revert optimistic update on error
      if (!newStatus && viewMode === 'starred') {
        fetchArticles(selectedCategory || undefined, currentPage, viewMode);
      } else {
        setArticles(articles.map(article => 
          article.id === articleId 
            ? { ...article, starred: currentStatus }
            : article
        ));
      }
    }
  };

  const handleRateArticle = async (articleId: number, rating: number | null) => {
    // Optimistic update
    setArticles(articles.map(article => 
      article.id === articleId 
        ? { ...article, rating: rating }
        : article
    ));

    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'rate', rating }),
    });

    if (!response.ok) {
      // Revert optimistic update on error
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, rating: article.rating }
          : article
      ));
    }
  };

  const handleToggleDeleted = async (articleId: number, currentStatus: boolean) => {
    // Optimistic update - remove from UI immediately when deleting
    const newStatus = !currentStatus;
    if (newStatus && viewMode !== 'deleted') {
      // If deleting and not in deleted view, remove from current view
      setArticles(articles.filter(article => article.id !== articleId));
    } else if (!newStatus && viewMode === 'deleted') {
      // If undeleting and in deleted view, remove from view
      setArticles(articles.filter(article => article.id !== articleId));
    }

    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'toggle_deleted' }),
    });

    if (!response.ok) {
      // Revert optimistic update on error - refresh the view
      fetchArticles(selectedCategory || undefined, currentPage, viewMode);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            {viewMode === 'starred' ? 'Starred Articles' : viewMode === 'deleted' ? 'Deleted Articles' : 'Reading List'}
          </h1>
          <p className="text-lg text-gray-600">
            {viewMode === 'starred' ? 'Your bookmarked articles' : viewMode === 'deleted' ? 'Articles you\'ve moved to trash' : 'Discover and organize your articles'}
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="mb-6 flex justify-center gap-2">
          <Button
            variant={viewMode === 'all' ? "default" : "outline"}
            onClick={() => handleViewModeClick('all')}
            className="rounded-full"
          >
            All Articles
          </Button>
          <Button
            variant={viewMode === 'starred' ? "default" : "outline"}
            onClick={() => handleViewModeClick('starred')}
            className="rounded-full flex items-center gap-2"
          >
            <StarIcon className="w-4 h-4" />
            Starred
          </Button>
          <Button
            variant={viewMode === 'deleted' ? "default" : "outline"}
            onClick={() => handleViewModeClick('deleted')}
            className="rounded-full flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Deleted
          </Button>
        </div>

        {/* Category Buttons - only show when in 'all' mode */}
        {viewMode === 'all' && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => handleCategoryClick(null, null)}
              className="rounded-full"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => handleCategoryClick(category.id, category.name)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="flex-none">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg leading-tight line-clamp-3">
                    {article.title}
                  </CardTitle>
                  {!article.is_read && (
                    <Badge variant="secondary" className="shrink-0">New</Badge>
                  )}
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
                <p className="text-gray-700 mb-4 flex-1 line-clamp-4">{article.summary}</p>
                
                {/* Rating Component */}
                {article.rating !== null && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-sm text-gray-600">Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarFilledIcon
                        key={star}
                        className={`w-4 h-4 cursor-pointer ${
                          star <= article.rating! ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => handleRateArticle(article.id, star)}
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRateArticle(article.id, null)}
                      className="ml-2 text-xs text-gray-500 h-6 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
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
                    
                    {/* Star Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStarred(article.id, article.starred)}
                      className="p-2"
                    >
                      {article.starred ? (
                        <StarFilledIcon className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    
                    {/* Rating Button */}
                    {article.rating === null && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className="w-4 h-4 cursor-pointer text-gray-300 hover:text-yellow-400"
                            onClick={() => handleRateArticle(article.id, star)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Delete Button - hide in deleted view, show restore in deleted view */}
                    {viewMode === 'deleted' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDeleted(article.id, article.deleted)}
                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50"
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDeleted(article.id, article.deleted)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleReadStatus(article.id, article.is_read)}
                    className={article.is_read ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-700"}
                  >
                    {article.is_read ? "Mark as Unread" : "Mark as Read"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <PaginationComponent 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Articles count info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Showing {articles.length} of {total} {viewMode === 'starred' ? 'starred' : viewMode === 'deleted' ? 'deleted' : ''} articles
          {selectedCategory && ' in selected category'}
        </div>
      </div>
    </main>
  );
}

// Pagination component using Shadcn
function PaginationComponent({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        
        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}