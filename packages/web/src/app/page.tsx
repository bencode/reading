'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/services/collectionService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightIcon } from '@radix-ui/react-icons';

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
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Weekly Reading
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Curated collections of the most interesting articles, 
            organized and summarized for your reading pleasure.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/articles">
              <Button size="lg">
                Browse All Articles
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            {isAuthenticated && (
              <Link href="/collections">
                <Button variant="outline" size="lg">
                  Manage Collections
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Collections List */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Collections</h2>
            <p className="text-gray-600">Recent weekly collections</p>
          </div>
          
          {collections.length > 0 && isAuthenticated && (
            <Link href="/collections">
              <Button variant="outline">
                Manage Issues
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading issues...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 mb-4">No collections published yet</div>
            {isAuthenticated && (
              <Link href="/collections/new">
                <Button>Create your first collection</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <Link href={`/weekly/${collection.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="default">Published</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(collection.published_at || collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {collection.cover_image && (
                      <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                        <img
                          src={collection.cover_image}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
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
                      <span className="group-hover:text-blue-600 transition-colors">
                        Read more →
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}