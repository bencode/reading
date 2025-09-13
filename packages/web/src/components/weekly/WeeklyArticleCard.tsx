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
  const displayContent = section.description || section.article?.summary;
  
  return (
    <article className="border-b border-gray-200 last:border-b-0">
      {/* Article Header - Image (no padding) */}
      {section.image && (
        <div className="w-full h-48 md:h-40 overflow-hidden rounded-t-lg">
          <img
            src={section.image}
            alt={section.title || section.article?.title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Article Body - Text content (with padding) */}
      <div className="px-6 py-8">
        {/* Article Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
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
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        {(section.external_url || section.article?.original_url) && (
          <div className="flex gap-3">
            <a
              href={section.external_url || section.article?.original_url}
              target="_blank"
              rel="noopener noreferrer"
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