'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Issue } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightIcon } from '@radix-ui/react-icons';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublishedIssues = async () => {
    setLoading(true);
    
    const response = await fetch('/api/issues?status=published&limit=10');
    const data = await response.json();
    
    setIssues(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPublishedIssues();
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
              <Link href="/issues">
                <Button variant="outline" size="lg">
                  Manage Issues
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Issues</h2>
            <p className="text-gray-600">Recent weekly collections</p>
          </div>
          
          {issues.length > 0 && (
            <Link href="/issues">
              <Button variant="outline">
                View All Issues
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading issues...</div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 mb-4">No issues published yet</div>
            {isAuthenticated && (
              <Link href="/issues/new">
                <Button>Create your first issue</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <Card key={issue.id} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <Link href={`/weekly/${issue.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="default">Published</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(issue.published_at || issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {issue.cover_image && (
                      <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                        <img
                          src={issue.cover_image}
                          alt={issue.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {issue.title}
                    </h3>
                    
                    {issue.description && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {issue.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{issue.sections?.length || 0} articles</span>
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

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Reading</h3>
              <p className="text-sm text-gray-600">Curated articles for thoughtful readers</p>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/articles" className="hover:text-gray-900">
                All Articles
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/issues" className="hover:text-gray-900">
                    Manage Issues
                  </Link>
                  <Link href="/issues/new" className="hover:text-gray-900">
                    Create Issue
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}