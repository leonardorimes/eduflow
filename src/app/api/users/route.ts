import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    await requireAdmin();
    const users = db.users.getAll().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      enrolledCourses: u.enrolledCourses,
    }));
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, email, password, role, enrolledCourses } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha obrigatórios' }, { status: 400 });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.users.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      createdAt: new Date().toISOString(),
      enrolledCourses: enrolledCourses || [],
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses,
    });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}
