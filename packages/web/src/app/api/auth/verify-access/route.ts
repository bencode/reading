import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });
  }

  // Check if the token matches the access token
  const isValid = token === AUTH_CONFIG.ACCESS_TOKEN;

  return NextResponse.json({ valid: isValid });
}