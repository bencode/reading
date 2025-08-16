import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function withAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Call the actual handler if authenticated
    return handler(request);
  };
}