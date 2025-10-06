'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/services/collections';
import { useAuth } from '@/contexts/AuthContext';

import { OptimizedImage } from '@/components/OptimizedImage';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublishedCollections = async () => {
    setLoading(true);
    
    const response = await fetch('/api/collections?status=published&limit=10');
    const data = await response.json();
    
    setCollections(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPublishedCollections();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Weekly Reading</h1>
              <p className="text-sm text-gray-600">Curated article collections</p>
            </div>
            
            {isAuthenticated && (
              <div className="flex gap-3">
                <Link href="/articles">
                  <Button variant="outline">
                    All Articles
                  </Button>
                </Link>
                <Link href="/collections">
                  <Button variant="outline">
                    Manage Collections
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Latest Collections</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">No collections published yet</div>
            {isAuthenticated && (
              <Link href="/collections/new">
                <Button>Create your first collection</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow group cursor-pointer overflow-hidden p-0">
                <Link href={`/weekly/${collection.id}`}>
                  {/* Card Header - Image (no padding) */}
                  {collection.cover_image && (
                    <div className="w-full h-48 overflow-hidden">
                      <OptimizedImage
                        src={collection.cover_image}
                        alt={collection.title}
                        size="full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* Card Body - Content (with padding) */}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {collection.title}
                    </h3>
                    
                    {collection.description && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {collection.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{collection.sections?.length || 0} articles</span>
                      <span>
                        {new Date(collection.published_at || collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}