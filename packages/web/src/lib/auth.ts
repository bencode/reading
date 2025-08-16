import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuration - In production, use environment variables
export const AUTH_CONFIG = {
  // Secret token for accessing the auth page
  ACCESS_TOKEN: process.env.ACCESS_TOKEN || 'your-secret-access-token',
  
  // JWT secret for session tokens
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  
  // Admin credentials
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10),
  
  // Token expiry
  TOKEN_EXPIRY: '7d',
};

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(username: string): string {
  return jwt.sign(
    { username, isAuthenticated: true },
    AUTH_CONFIG.JWT_SECRET,
    { expiresIn: AUTH_CONFIG.TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): { username: string; isAuthenticated: boolean } | null {
  try {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as any;
  } catch {
    return null;
  }
}