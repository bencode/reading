'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collection, PaginatedResponse } from '@/services/collectionService';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon } from '@radix-ui/react-icons';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function CollectionsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const fetchCollections = async (status?: string, page: number = 1) => {
    setLoading(true);
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pagination.limit.toString());
    
    if (status && status !== 'all') {
      params.set('status', status);
    }
    
    const response = await fetch(`/api/collections?${params}`);
    const data: PaginatedResponse<Collection> = await response.json();
    
    setCollections(data.data);
    setPagination({
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages
    });
    
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections(statusFilter);
    }
  }, [isAuthenticated, statusFilter]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    fetchCollections(statusFilter, newPage);
  };

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 
           status === 'draft' ? 'secondary' : 'outline';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Please log in to access Collections</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Collections</h1>
            <p className="text-gray-600">Curated article collections</p>
          </div>
          
          <Link href="/collections/new">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 mb-4">No collections found</div>
            <Link href="/collections/new">
              <Button>Create your first collection</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant={getStatusColor(collection.status)}>
                        {collection.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {collection.cover_image && (
                        <div className="w-full h-32 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={collection.cover_image}
                            alt={collection.title}
                            preset="thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {collection.title}
                        </h3>
                        
                        {collection.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-500">
                          {collection.sections?.length || 0} articles
                        </span>
                        
                        <div className="flex gap-2">
                          <Link href={`/collections/${collection.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/collections/${collection.id}`}>
                            <Button size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600 px-4">
                  Page {pagination.page} of {pagination.totalPages} 
                  ({pagination.total} total)
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}