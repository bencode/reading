import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Collection } from '@/services/collectionService';
import { ExternalLinkIcon } from '@radix-ui/react-icons';

type Section = NonNullable<Collection['sections']>[0];

type WeeklyArticleCardProps = {
  section: Section;
  index: number;
};

export default function WeeklyArticleCard({ section, index }: WeeklyArticleCardProps) {
  return (
    <Card className="overflow-hidden bg-white">
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
  );
}