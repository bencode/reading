'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Issue } from '@/services/issueService';
import IssueForm from '@/components/IssueForm';

export default function EditIssuePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const issueId = params.id as string;

  const fetchIssue = async () => {
    setLoading(true);
    
    const response = await fetch(`/api/issues/${issueId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch issue');
    }
    
    const data: Issue = await response.json();
    setIssue(data);
    setLoading(false);
  };

  useEffect(() => {
    if (issueId && isAuthenticated) {
      fetchIssue();
    }
  }, [issueId, isAuthenticated]);

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

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Issue not found</div>
      </div>
    );
  }

  return <IssueForm mode="edit" initialData={issue} />;
}