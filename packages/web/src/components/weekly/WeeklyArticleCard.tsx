import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Collection } from '@/services/collections';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { OptimizedImage } from '@/components/OptimizedImage';

type Section = NonNullable<Collection['sections']>[0];

type WeeklyArticleCardProps = {
  section: Section;
  index: number;
};

export default function WeeklyArticleCard({ section, index }: WeeklyArticleCardProps) {
  const displayContent = section.description || section.article?.summary;
  
  return (
    <article className="group">
      {/* Article Header - Image (no padding) */}
      {section.image && (
        <div className="w-full h-56 md:h-48 lg:h-56 overflow-hidden">
          <OptimizedImage
            src={section.image}
            alt={section.title || section.article?.title || ''}
            size="full"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        </div>
      )}
      
      {/* Article Body - Text content (with padding) */}
      <div className="px-4 py-4">
        {/* Article Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {section.title || section.article?.title || 'Untitled'}
        </h2>
        
        {/* Meta Information */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          {section.article?.source_name && (
            <Badge variant="outline" className="text-xs">
              {section.article.source_name}
            </Badge>
          )}
          {section.article?.published_at && (
            <span>
              {new Date(section.article.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {/* Description/Content */}
        {displayContent && (
          <div className="mb-6">
            <MarkdownRenderer 
              content={displayContent}
              className="text-gray-700"
            />
          </div>
        )}
        
        {/* Action Buttons */}
        {(section.external_url || section.article?.original_url) && (
          <div className="flex gap-3">
            <a
              href={section.external_url || section.article?.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Button size="sm">
                Read Original
                <ExternalLinkIcon className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}