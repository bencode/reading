'use client';

import { Article, Category, PaginatedResponse } from '../services/articleService';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchArticles = async (categoryId?: number, page: number = 1) => {
    const params = new URLSearchParams();
    if (categoryId) {
      params.set('categoryId', categoryId.toString());
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
  }, [selectedCategory]);

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

  const handlePageChange = (page: number) => {
    fetchArticles(selectedCategory || undefined, page);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Reading List</h1>
          <p className="text-lg text-gray-600">Discover and organize your articles</p>
        </div>

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
                  <CardTitle className="text-lg leading-tight line-clamp-3">
                    {article.title}
                  </CardTitle>
                  {!article.is_read && (
                    <Badge variant="secondary" className="shrink-0">New</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 text-sm text-gray-600">
                  <Badge variant="outline">{article.source_name}</Badge>
                  <span>•</span>
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-700 mb-4 flex-1 line-clamp-4">{article.summary}</p>
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={article.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Original
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={article.is_read ? "text-green-600" : "text-gray-500"}
                  >
                    {article.is_read ? "Read" : "Mark as Read"}
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
          Showing {articles.length} of {total} articles
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