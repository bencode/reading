'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/services/collectionService';
import { ArrowLeftIcon, ExternalLinkIcon, CalendarIcon, ReaderIcon } from '@radix-ui/react-icons';

export default function WeeklyCollectionPage() {
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  const collectionId = params.id as string;

  const fetchCollection = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/collections/${collectionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound();
        return;
      }
      throw new Error('Failed to fetch collection');
    }
    
    const data: Collection = await response.json();
    
    // Only show published collections in public view
    if (data.status !== 'published') {
      notFound();
      return;
    }
    
    setCollection(data);
    setLoading(false);
  };

  useEffect(() => {
    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Collection not found</div>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="default">Published</Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              {new Date(collection.published_at || collection.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ReaderIcon className="w-4 h-4" />
              {collection.sections?.length || 0} articles
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.title}</h1>
          
          {collection.description && (
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {collection.cover_image && (
        <div className="bg-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden">
              <img
                src={collection.cover_image}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Articles */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {collection.sections && collection.sections.length > 0 ? (
          <div className="space-y-8">
            {collection.sections.map((section, index) => (
              <Card key={section.id} className="overflow-hidden bg-white">
                <CardContent className="p-8">
                  <div className="flex gap-8">
                    {/* Section Image */}
                    {section.image && (
                      <div className="flex-shrink-0 hidden md:block">
                        <div className="w-48 h-36 rounded-lg overflow-hidden">
                          <img
                            src={section.image}
                            alt={section.title || section.article?.title || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-medium">
                              Article {index + 1}
                            </span>
                            {section.article?.source_name && (
                              <Badge variant="outline" className="text-xs">
                                {section.article.source_name}
                              </Badge>
                            )}
                          </div>
                          
                          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            {section.title || section.article?.title || 'Untitled'}
                          </h2>
                          
                          {section.article?.published_at && (
                            <div className="text-sm text-gray-500 mb-4">
                              Originally published {new Date(section.article.published_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {section.external_url && (
                            <a
                              href={section.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLinkIcon className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          
                          {section.article?.original_url && (
                            <a
                              href={section.article.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm">
                                Read Original
                                <ExternalLinkIcon className="w-4 h-4 ml-2" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile Image */}
                      {section.image && (
                        <div className="md:hidden mb-4">
                          <div className="w-full h-48 rounded-lg overflow-hidden">
                            <img
                              src={section.image}
                              alt={section.title || section.article?.title || ''}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      {section.description && (
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-900 mb-3">Commentary</h3>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {section.description}
                          </p>
                        </div>
                      )}
                      
                      {section.article?.summary && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
                          <p className="text-gray-700 leading-relaxed">
                            {section.article.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">No articles in this collection</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Weekly Reading</h3>
              <p className="text-gray-600">Curated articles for thoughtful readers</p>
            </div>
            
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                More Collections
              </Link>
              <Link href="/articles" className="text-gray-600 hover:text-gray-900">
                All Articles
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}