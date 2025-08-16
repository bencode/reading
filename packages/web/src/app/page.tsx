'use client';

import { Article, Category, PaginatedResponse } from '../services/articleService';
import { useState, useEffect, Suspense } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, logout } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    starred: false,
    read: false,
    deleted: false
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchArticles = async (categoryId?: number, page: number = 1) => {
    const params = new URLSearchParams();
    if (categoryId) {
      params.set('categoryId', categoryId.toString());
    }
    
    // Set filters based on current filter state
    if (filters.starred) {
      params.set('starred', 'true');
    }
    
    if (filters.read) {
      params.set('read', 'true');
    }
    
    if (filters.deleted) {
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

      await fetchArticles(initialCategoryId || undefined, 1);
    };
    fetchInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (selectedCategory !== null || selectedCategory === null) {
      setCurrentPage(1);
      fetchArticles(selectedCategory || undefined, 1);
    }
  }, [selectedCategory, filters]);

  const handleCategoryClick = (categoryId: number | null, categoryName: string | null) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams.toString());
    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  };

  const handleFilterToggle = (filterKey: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const handlePageChange = (page: number) => {
    fetchArticles(selectedCategory || undefined, page);
  };

  const handleToggleStatus = async (articleId: number, field: string, currentStatus: boolean) => {
    if (!isAuthenticated) {
      return; // Don't allow actions if not authenticated
    }
    
    const newStatus = !currentStatus;
    const article = articles.find(a => a.id === articleId);
    
    if (article && shouldRemoveFromView(article, field, newStatus)) {
      // Remove from view if it no longer matches filters
      setArticles(articles.filter(article => article.id !== articleId));
    } else {
      // Update in place
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, [field]: newStatus }
          : article
      ));
    }

    // Map field names to API actions
    const actionMap: Record<string, string> = {
      'is_read': 'toggle_read',
      'starred': 'toggle_starred',
      'deleted': 'toggle_deleted'
    };

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: actionMap[field] }),
    });

    if (!response.ok) {
      // Revert optimistic update on error - refresh the view
      fetchArticles(selectedCategory || undefined, currentPage);
    }
  };

  const handleToggleReadStatus = (articleId: number, currentStatus: boolean) => 
    handleToggleStatus(articleId, 'is_read', currentStatus);

  const handleToggleStarred = (articleId: number, currentStatus: boolean) => 
    handleToggleStatus(articleId, 'starred', currentStatus);

  const handleToggleDeleted = (articleId: number, currentStatus: boolean) => 
    handleToggleStatus(articleId, 'deleted', currentStatus);

  const shouldRemoveFromView = (article: Article, updatedField: string, newValue: boolean) => {
    // Check if the article would still match current filters after the update
    const updatedArticle = { ...article, [updatedField]: newValue };
    
    // Check starred filter
    if (filters.starred && !updatedArticle.starred) {
      return true;
    }
    
    // Check readed filter
    if (filters.read && !updatedArticle.is_read) {
      return true;
    }
    
    // Check deleted filter
    if (filters.deleted && !updatedArticle.deleted) {
      return true;
    }
    
    // If no filter is active or article matches all active filters, keep it
    return false;
  };

  const handleRateArticle = async (articleId: number, rating: number | null) => {
    if (!isAuthenticated) {
      return; // Don't allow actions if not authenticated
    }

    // Optimistic update
    setArticles(articles.map(article => 
      article.id === articleId 
        ? { ...article, rating: rating }
        : article
    ));

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Authentication status - fixed position */}
        {isAuthenticated && (
          <div className="fixed top-4 right-4 z-10 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border">
            <span className="text-sm text-green-600">✓ Authenticated</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        )}

        {/* Header - properly centered */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Reading List</h1>
          <p className="text-lg text-gray-600">Discover and organize your articles</p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex justify-center gap-2">
          <Button
            variant={filters.starred ? "default" : "outline"}
            onClick={() => handleFilterToggle('starred')}
            className="rounded-full flex items-center gap-2"
          >
            <StarIcon className="w-4 h-4" />
            Starred
          </Button>
          <Button
            variant={filters.read ? "default" : "outline"}
            onClick={() => handleFilterToggle('read')}
            className="rounded-full"
          >
            Read
          </Button>
          <Button
            variant={filters.deleted ? "default" : "outline"}
            onClick={() => handleFilterToggle('deleted')}
            className="rounded-full flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Deleted
          </Button>
        </div>

        {/* Category Buttons */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articles.map((article) => (
            <Card key={article.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="flex-none">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg leading-tight">
                    {article.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {!article.is_read && (
                      <Badge variant="secondary">New</Badge>
                    )}
                    {/* Delete Button in top-right corner - only show if authenticated */}
                    {isAuthenticated && (article.deleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDeleted(article.id, article.deleted)}
                        className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50"
                        title="Restore article"
                      >
                        ↻
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDeleted(article.id, article.deleted)}
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
                
                {/* Rating Component - only show if authenticated */}
                {isAuthenticated && article.rating !== null && (
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
                    
                    {/* Star Button - only show if authenticated */}
                    {isAuthenticated && (
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
                    )}
                    
                    {/* Rating Button - only show if authenticated and no rating yet */}
                    {isAuthenticated && article.rating === null && (
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
                  </div>

                  {/* Read Status Button - only show if authenticated */}
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleReadStatus(article.id, article.is_read)}
                      className={article.is_read ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-700"}
                    >
                      {article.is_read ? "Mark as Unread" : "Mark as Read"}
                    </Button>
                  )}
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
          Showing {articles.length} of {total} articles
          {selectedCategory && ' in selected category'}
          {(filters.starred || filters.read || filters.deleted) && (
            <span> with filters: {[
              filters.starred && 'starred',
              filters.read && 'read', 
              filters.deleted && 'deleted'
            ].filter(Boolean).join(', ')}</span>
          )}
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
