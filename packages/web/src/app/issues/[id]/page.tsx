'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Issue } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, Pencil1Icon, ExternalLinkIcon } from '@radix-ui/react-icons';

export default function IssueDetailPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const issueId = params.id as string;

  const fetchIssue = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/issues/${issueId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        router.push('/issues');
        return;
      }
      throw new Error('Failed to fetch issue');
    }
    
    const data: Issue = await response.json();
    setIssue(data);
    setLoading(false);
  };

  useEffect(() => {
    if (issueId) {
      fetchIssue();
    }
  }, [issueId]);

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 
           status === 'draft' ? 'secondary' : 'outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading issue...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Issue not found</div>
          <Link href="/issues">
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
            <Link href="/issues">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Issues
              </Button>
            </Link>
            
            {isAuthenticated && (
              <Link href={`/issues/${issue.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil1Icon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={getStatusColor(issue.status)}>
              {issue.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {new Date(issue.created_at).toLocaleDateString()}
            </span>
            {issue.published_at && (
              <span className="text-sm text-gray-500">
                • Published {new Date(issue.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{issue.title}</h1>
          
          {issue.description && (
            <p className="text-lg text-gray-600 leading-relaxed">{issue.description}</p>
          )}
        </div>

        {/* Cover Image */}
        {issue.cover_image && (
          <div className="mb-8">
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img
                src={issue.cover_image}
                alt={issue.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {issue.sections && issue.sections.length > 0 ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Articles ({issue.sections.length})
              </h2>
              
              {issue.sections.map((section, index) => (
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
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {section.description}
                          </p>
                        )}
                        
                        {section.article?.summary && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {section.article.summary}
                            </p>
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
              <div className="text-lg text-gray-600 mb-4">No articles in this issue</div>
              {isAuthenticated && (
                <Link href={`/issues/${issue.id}/edit`}>
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