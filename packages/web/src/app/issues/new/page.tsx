'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Article, PaginatedResponse } from '../../../services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import ImagePicker from '@/components/ImagePicker';

type IssueStatus = 'draft' | 'published' | 'archived';

type IssueSection = {
  id?: number;
  article_id: number;
  title?: string;
  description?: string;
  image?: string;
  external_url?: string;
  order_index: number;
  article?: Article;
};

type IssueFormData = {
  title: string;
  description: string;
  cover_image: string;
  status: IssueStatus;
  sections: IssueSection[];
};

export default function IssueEditor() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    cover_image: '',
    status: 'draft',
    sections: []
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchArticles = async (search: string = '') => {
    const params = new URLSearchParams();
    params.set('limit', '50');
    params.set('read', 'true'); // Only show read articles for Issues
    if (search) {
      params.set('search', search);
    }
    
    const response = await fetch(`/api/articles?${params}`);
    const data: PaginatedResponse<Article> = await response.json();
    setArticles(data.data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchArticles(searchTerm);
    }
  }, [searchTerm, isAuthenticated]);

  const addArticleToSection = (article: Article) => {
    if (formData.sections.find(s => s.article_id === article.id)) {
      return; // Already added
    }
    
    const newSection: IssueSection = {
      article_id: article.id,
      title: article.title,
      description: article.summary,
      external_url: article.original_url,
      order_index: formData.sections.length,
      article
    };
    
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setShowArticleDialog(false);
  };

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index: number, updates: Partial<IssueSection>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, ...updates } : section
      )
    }));
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.sections.length) return;
    
    const sections = [...formData.sections];
    const [movedSection] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, movedSection);
    
    // Update order_index
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order_index: index
    }));
    
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Implement API call to create/update issue
      console.log('Saving issue:', formData);
      // router.push('/issues');
    } catch (error) {
      console.error('Error saving issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setFormData(prev => ({ ...prev, status: 'published' }));
    // Will trigger submit through form
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Redirecting to auth...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Issue</h1>
          <p className="text-gray-600">Curate articles into a themed collection</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Weekly Tech Digest #1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this issue..."
                  rows={3}
                />
              </div>
              
              <div>
                <ImagePicker
                  value={formData.cover_image}
                  onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                  label="Cover Image"
                  placeholder="Select or generate cover image..."
                  context={formData.title || 'Issue cover image'}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: IssueStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Article Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Article Sections ({formData.sections.length})</CardTitle>
              <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Article</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {articles.map((article) => (
                        <div
                          key={article.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            formData.sections.find(s => s.article_id === article.id) 
                              ? 'opacity-50 pointer-events-none bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => addArticleToSection(article)}
                        >
                          <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{article.summary}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline">{article.source_name}</Badge>
                            <span className="text-gray-500">
                              {new Date(article.published_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {formData.sections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No articles added yet.</p>
                  <p className="text-sm">Click "Add Article" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.sections.map((section, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(index, index - 1)}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <span className="text-gray-400 text-lg">⋮⋮</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(index, index + 1)}
                              disabled={index === formData.sections.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">Original Article</Label>
                              <p className="font-medium text-sm">{section.article?.title}</p>
                            </div>
                            
                            <div>
                              <Label htmlFor={`section-title-${index}`}>Custom Title</Label>
                              <Input
                                id={`section-title-${index}`}
                                value={section.title || ''}
                                onChange={(e) => updateSection(index, { title: e.target.value })}
                                placeholder="Override article title..."
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`section-description-${index}`}>Custom Description</Label>
                              <Textarea
                                id={`section-description-${index}`}
                                value={section.description || ''}
                                onChange={(e) => updateSection(index, { description: e.target.value })}
                                placeholder="Override article summary..."
                                rows={4}
                              />
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <ImagePicker
                                  value={section.image || ''}
                                  onChange={(url) => updateSection(index, { image: url })}
                                  label="Section Image"
                                  placeholder="Select or generate section image..."
                                  context={section.title || section.article?.title || 'Section image'}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`section-url-${index}`}>External URL</Label>
                                <Input
                                  id={`section-url-${index}`}
                                  type="url"
                                  value={section.external_url || ''}
                                  onChange={(e) => updateSection(index, { external_url: e.target.value })}
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/issues')}
            >
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                type="button"
                disabled={loading || !formData.title.trim() || formData.sections.length === 0}
                onClick={handlePublish}
              >
                {loading ? 'Publishing...' : 'Publish Issue'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}