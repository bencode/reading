'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Article, Category, PaginatedResponse } from '@/services/articleService'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import ArticleFilters, { type FilterState } from './components/ArticleFilters'
import CategoryFilter from './components/CategoryFilter'
import ArticleList from './components/ArticleList'
import PaginationComponent from './components/PaginationComponent'
import ArticleStats from './components/ArticleStats'

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, logout } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    starred: false,
    read: false,
    deleted: false
  })
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchArticles = async (categoryId?: number, page: number = 1) => {
    const params = new URLSearchParams()
    if (categoryId) {
      params.set('categoryId', categoryId.toString())
    }
    
    if (filters.starred) {
      params.set('starred', 'true')
    }
    
    if (filters.read) {
      params.set('read', 'true')
    }
    
    if (filters.deleted) {
      params.set('deleted', 'true')
    }
    
    params.set('page', page.toString())
    params.set('limit', '12')
    
    const response = await fetch(`/api/articles?${params}`)
    const data: PaginatedResponse<Article> = await response.json()
    setArticles(data.data)
    setTotalPages(data.totalPages)
    setTotal(data.total)
    setCurrentPage(data.page)
  }

  const fetchCategories = async () => {
    const response = await fetch('/api/categories')
    const data = await response.json()
    setCategories(data)
  }

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
    setSelectedCategory(categoryId)
    const params = new URLSearchParams(searchParams.toString())
    if (categoryName) {
      params.set('category', categoryName)
    } else {
      params.delete('category')
    }
    router.push(`?${params.toString()}`)
  }

  const handleFilterToggle = (filterKey: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }))
  }

  const handlePageChange = (page: number) => {
    fetchArticles(selectedCategory || undefined, page)
  }

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
      'is_skipped': 'toggle_skip',
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

  const handleToggleSkipStatus = (articleId: number, currentStatus: boolean) => 
    handleToggleStatus(articleId, 'is_skipped', currentStatus);

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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Articles</h1>
          <p className="text-lg text-gray-600">Browse and manage your reading collection</p>
        </div>

        <ArticleFilters 
          filters={filters}
          onFilterToggle={handleFilterToggle}
        />

        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        <ArticleList 
          articles={articles}
          isAuthenticated={isAuthenticated}
          onToggleRead={handleToggleReadStatus}
          onToggleSkip={handleToggleSkipStatus}
          onToggleStarred={handleToggleStarred}
          onToggleDeleted={handleToggleDeleted}
          onRateArticle={handleRateArticle}
        />

        {totalPages > 1 && (
          <div className="mt-8">
            <PaginationComponent 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <ArticleStats 
          articlesCount={articles.length}
          total={total}
          selectedCategory={selectedCategory}
          filters={filters}
        />
      </div>
    </main>
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
