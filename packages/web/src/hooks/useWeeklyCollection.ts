import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import type { Collection } from '@/services/collectionService';

export function useWeeklyCollection(collectionId: string) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionId) return;

    const fetchCollection = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`/api/collections/${collectionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
            return;
          }
          throw new Error('Failed to fetch collection');
        }
        
        const data: Collection = await response.json();
        
        if (data.status !== 'published') {
          notFound();
          return;
        }
        
        setCollection(data);
      } catch (error) {
        console.error('Error fetching collection:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  return { collection, loading };
}