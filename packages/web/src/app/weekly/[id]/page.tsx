'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWeeklyCollection } from '@/hooks/useWeeklyCollection';
import WeeklyHeader from '@/components/weekly/WeeklyHeader';
import WeeklyArticleCard from '@/components/weekly/WeeklyArticleCard';
import WeeklyFooter from '@/components/weekly/WeeklyFooter';

export default function WeeklyCollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const { collection, loading } = useWeeklyCollection(collectionId);

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
      <WeeklyHeader collection={collection} />

      <div className="container mx-auto py-4 max-w-4xl">
        {collection.sections && collection.sections.length > 0 ? (
          <div className="space-y-8">
            {collection.sections.map((section, index) => (
              <div className="bg-white rounded-lg" key={section.id}>
                <WeeklyArticleCard section={section} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="text-lg text-gray-600">No articles in this collection</div>
          </div>
        )}
      </div>

      <WeeklyFooter />
    </div>
  );
}