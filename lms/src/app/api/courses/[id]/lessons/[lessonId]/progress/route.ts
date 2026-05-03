import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: courseId, lessonId } = await params;
  const progress = db.progress.findByUserCourseLesson(session.userId, courseId, lessonId);
  return NextResponse.json(progress || null);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: courseId, lessonId } = await params;
  const data = await req.json();

  const existing = db.progress.findByUserCourseLesson(session.userId, courseId, lessonId);
  const progress = db.progress.upsert({
    userId: session.userId,
    courseId,
    lessonId,
    theoryCompleted: data.theoryCompleted ?? existing?.theoryCompleted ?? false,
    theoryWatchedSeconds: data.theoryWatchedSeconds ?? existing?.theoryWatchedSeconds ?? 0,
    practiceCompleted: data.practiceCompleted ?? existing?.practiceCompleted ?? false,
    practiceWatchedSeconds: data.practiceWatchedSeconds ?? existing?.practiceWatchedSeconds ?? 0,
    quizScore: data.quizScore !== undefined ? data.quizScore : (existing?.quizScore ?? null),
    quizPassed: data.quizPassed ?? existing?.quizPassed ?? false,
    completedAt: data.completedAt ?? existing?.completedAt ?? null,
  });

  return NextResponse.json(progress);
}
