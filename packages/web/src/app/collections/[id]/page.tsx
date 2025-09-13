'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/services/collectionService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, Pencil1Icon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function CollectionDetailPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  const collectionId = params.id as string;

  const fetchIssue = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/collections/${collectionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        router.push('/collections');
        return;
      }
      throw new Error('Failed to fetch collection');
    }
    
    const data: Collection = await response.json();
    setCollection(data);
    setLoading(false);
  };

  useEffect(() => {
    if (collectionId) {
      fetchIssue();
    }
  }, [collectionId]);

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 
           status === 'draft' ? 'secondary' : 'outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Issue not found</div>
          <Link href="/collections">
            <Button>Back to Issues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/collections">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Issues
              </Button>
            </Link>
            
            {isAuthenticated && (
              <Link href={`/collections/${collection.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil1Icon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={getStatusColor(collection.status)}>
              {collection.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {new Date(collection.created_at).toLocaleDateString()}
            </span>
            {collection.published_at && (
              <span className="text-sm text-gray-500">
                • Published {new Date(collection.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.title}</h1>
          
          {collection.description && (
            <MarkdownRenderer 
              content={collection.description}
              className="text-lg text-gray-600"
            />
          )}
        </div>

        {/* Cover Image */}
        {collection.cover_image && (
          <div className="mb-8">
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img
                src={collection.cover_image}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {collection.sections && collection.sections.length > 0 ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Articles ({collection.sections.length})
              </h2>
              
              {collection.sections.map((section, index) => (
                <Card key={section.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Section Image */}
                      {section.image && (
                        <div className="flex-shrink-0">
                          <div className="w-32 h-24 rounded-lg overflow-hidden">
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {section.title || section.article?.title || 'Untitled'}
                            </h3>
                            
                            {section.article?.source_name && (
                              <div className="text-sm text-gray-500 mb-2">
                                {section.article.source_name}
                                {section.article.published_at && (
                                  <span> • {new Date(section.article.published_at).toLocaleDateString()}</span>
                                )}
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
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {section.description && (
                          <div className="mb-3">
                            <MarkdownRenderer 
                              content={section.description}
                              className="text-gray-600"
                            />
                          </div>
                        )}
                        
                        {section.article?.summary && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                            <MarkdownRenderer 
                              content={section.article.summary}
                              className="text-gray-700 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600 mb-4">No articles in this collection</div>
              {isAuthenticated && (
                <Link href={`/collections/${collection.id}/edit`}>
                  <Button>Add Articles</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}