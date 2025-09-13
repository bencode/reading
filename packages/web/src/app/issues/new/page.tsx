'use client';

import { useAuth } from '@/contexts/AuthContext';
import IssueForm from '@/components/IssueForm';

export default function NewIssuePage() {
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

  return <IssueForm mode="create" />;
}