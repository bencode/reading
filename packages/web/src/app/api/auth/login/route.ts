import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // Verify password
  const isValidPassword = verifyPassword(password, AUTH_CONFIG.ADMIN_PASSWORD_HASH);

  if (!isValidPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // Generate JWT token
  const token = generateToken(AUTH_CONFIG.ADMIN_USERNAME);

  // Set cookie and return token
  const response = NextResponse.json({ success: true, token });
  
  // Set HTTP-only cookie for better security
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}