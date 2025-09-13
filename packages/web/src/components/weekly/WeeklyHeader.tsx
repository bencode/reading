import Link from 'next/link';
import { Collection } from '@/services/collectionService';
import { ArrowLeftIcon, CalendarIcon, ReaderIcon } from '@radix-ui/react-icons';

type WeeklyHeaderProps = {
  collection: Collection;
};

export default function WeeklyHeader({ collection }: WeeklyHeaderProps) {
  return (
    <div className="bg-white border-b">
      {/* Cover Image */}
      {collection.cover_image && (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img
            src={collection.cover_image}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              {new Date(collection.published_at || collection.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-1">
              <ReaderIcon className="w-4 h-4" />
              {collection.sections?.length || 0} articles
            </div>
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