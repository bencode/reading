'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Collection } from '@/services/collectionService';
import CollectionForm from '@/components/CollectionForm';

export default function EditCollectionPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  const collectionId = params.id as string;

  const fetchCollection = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/collections/${collectionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch collection');
    }
    
    const data: Collection = await response.json();
    setCollection(data);
    setLoading(false);
  };

  useEffect(() => {
    if (collectionId && isAuthenticated) {
      fetchCollection();
    }
  }, [collectionId, isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Access Denied</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Collection not found</div>
      </div>
    );
  }

  return <CollectionForm mode="edit" initialData={collection} />;
}