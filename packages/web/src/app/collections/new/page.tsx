'use client';

import { useAuth } from '@/contexts/AuthContext';
import CollectionForm from '@/components/CollectionForm';

export default function NewCollectionPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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

  return <CollectionForm mode="create" />;
}