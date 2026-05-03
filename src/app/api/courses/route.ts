import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { detectVideoType } from '@/lib/video';

export async function GET() {
  const courses = db.courses.getAll();
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { title, description, thumbnail, category } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
    }

    // Create course with 16 empty lessons
    const courseId = uuidv4();
    const lessons = Array.from({ length: 16 }, (_, i) => ({
      id: uuidv4(),
      courseId,
      title: `Aula ${i + 1}`,
      order: i + 1,
      theory: {
        videoUrl: '',
        videoType: 'youtube' as const,
        duration: 600,
        description: '',
      },
      practice: {
        videoUrl: '',
        videoType: 'youtube' as const,
        duration: 600,
        description: '',
      },
      quiz: Array.from({ length: 10 }, (_, q) => ({
        id: uuidv4(),
        question: `Pergunta ${q + 1}`,
        options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctIndex: 0,
      })),
    }));

    const course = db.courses.create({
      id: courseId,
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      category: category || 'Geral',
      createdAt: new Date().toISOString(),
      lessons,
    });

    return NextResponse.json(course);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }
    return NextResponse.json({ error: `Erro ao criar curso: ${msg}` }, { status: 500 });
  }
}
