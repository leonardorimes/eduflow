import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = db.users.findById(id);
    if (!user) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    const { password: _pwd, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const updated = db.users.update(id, data);
    if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    const { password: _pwd, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deleted = db.users.delete(id);
    if (!deleted) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}
