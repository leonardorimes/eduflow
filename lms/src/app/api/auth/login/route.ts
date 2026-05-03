import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
  }

  // Check if any admin exists, if not create default
  const users = db.users.getAll();
  if (users.filter(u => u.role === 'admin').length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.users.create({
      id: uuidv4(),
      name: 'Administrador',
      email: 'admin@escola.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      enrolledCourses: [],
    });
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  response.cookies.set('lms-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
