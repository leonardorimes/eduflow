import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db, User } from './db';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lms-secret-key-2024-change-in-production'
);

export async function signToken(payload: { userId: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lms-token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  return db.users.findById(session.userId) || null;
}

export async function requireAdmin() {
  // Validate via JWT session only (role is encoded in the token)
  // This avoids a DB lookup that may fail on stateless/serverless environments
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  // Also try to return the full user if available
  const user = db.users.findById(session.userId);
  return user ?? { id: session.userId, email: session.email, role: session.role as 'admin' | 'student', name: 'Admin', password: '', createdAt: '', enrolledCourses: [] };
}

export async function requireStudent() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  const user = db.users.findById(session.userId);
  return user ?? { id: session.userId, email: session.email, role: session.role as 'admin' | 'student', name: session.email, password: '', createdAt: '', enrolledCourses: [] };
}
