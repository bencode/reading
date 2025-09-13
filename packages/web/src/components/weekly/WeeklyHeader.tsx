import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collection } from '@/services/collectionService';
import { ArrowLeftIcon, CalendarIcon, ReaderIcon } from '@radix-ui/react-icons';

type WeeklyHeaderProps = {
  collection: Collection;
};

export default function WeeklyHeader({ collection }: WeeklyHeaderProps) {
  return (
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
  );
}