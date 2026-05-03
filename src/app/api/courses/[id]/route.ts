import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = db.courses.findById(id);
  if (!course) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const updated = db.courses.update(id, data);
    if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deleted = db.courses.delete(id);
    if (!deleted) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    return NextResponse.json({ error: `Erro: ${msg}` }, { status: 500 });
  }
}
