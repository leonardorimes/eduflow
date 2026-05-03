import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET all progress for a user in a course
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: courseId } = await params;
  const progress = db.progress.findByUserAndCourse(session.userId, courseId);
  return NextResponse.json(progress);
}
