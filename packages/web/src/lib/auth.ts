import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuration - In production, use environment variables
export const AUTH_CONFIG = {
  // Secret token for accessing the auth page
  ACCESS_TOKEN: process.env.ACCESS_TOKEN || 'your-secret-access-token',
  
  // JWT secret for session tokens
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  
  // Admin credentials
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  
  // Token expiry
  TOKEN_EXPIRY: '7d' as const,
};

export function verifyPassword(password: string): boolean {
  // Get hash at runtime to avoid build-time errors
  let passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash && process.env.ADMIN_PASSWORD_HASH_ENCODED) {
    passwordHash = Buffer.from(process.env.ADMIN_PASSWORD_HASH_ENCODED, 'base64').toString();
  }
  
  if (!passwordHash) {
    throw new Error('Password hash environment variable is required');
  }
  
  return bcrypt.compareSync(password, passwordHash);
}

export function generateToken(username: string): string {
  const payload = { username, isAuthenticated: true };
  const secret = AUTH_CONFIG.JWT_SECRET;
  const options: SignOptions = { expiresIn: AUTH_CONFIG.TOKEN_EXPIRY };
  
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): { username: string; isAuthenticated: boolean } | null {
  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
    return decoded as { username: string; isAuthenticated: boolean };
  } catch {
    return null;
  }
}