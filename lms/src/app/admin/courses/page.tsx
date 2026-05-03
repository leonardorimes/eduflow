'use client';
import { useState, useEffect, useCallback } from 'react';

interface Course { id: string; title: string; description: string; thumbnail: string; category: string; createdAt: string; lessons: unknown[]; }

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', thumbnail: '', category: 'Geral' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/courses');
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.title) { setError('Título obrigatório'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); setForm({ title: '', description: '', thumbnail: '', category: 'Geral' }); load(); }
    else { const d = await res.json(); setError(d.error || 'Erro ao criar curso'); }
    setSaving(false);
  }

  async function deleteCourse(id: string) {
    if (!confirm('Excluir este curso? Isso não pode ser desfeito.')) return;
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    load();
  }

  const EMOJI_OPTIONS = ['📚', '🎯', '💡', '🔬', '🎨', '🖥️', '📊', '🏆', '🚀', '🎵', '🧮', '📐'];

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Gerenciar Cursos</h2>
          <p className="page-subtitle">{courses.length} curso(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo Curso</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="animate-pulse">Carregando...</div></div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Nenhum curso criado</h3>
          <p>Crie seu primeiro curso para começar</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}>+ Criar Primeiro Curso</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {courses.map(c => (
            <div key={c.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{c.thumbnail || '📚'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.category} • {c.lessons.length} aulas</div>
                </div>
              </div>
              {c.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.description}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <a href={`/admin/courses/${c.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>✏️ Editar Aulas</a>
                <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Novo Curso</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Título do Curso *</label>
              <input className="form-input" placeholder="Ex: Marketing Digital" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-input form-textarea" placeholder="Descrição do curso..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <input className="form-input" placeholder="Ex: Marketing, Tecnologia, Design..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Ícone do Curso</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {EMOJI_OPTIONS.map(em => (
                  <button key={em} type="button" onClick={() => setForm(f => ({ ...f, thumbnail: em }))}
                    style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.thumbnail === em ? 'var(--accent)' : 'var(--border)'}`, background: form.thumbnail === em ? 'rgba(59,130,246,0.15)' : 'var(--bg-elevated)', cursor: 'pointer' }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="form-error" style={{ marginBottom: '12px' }}>⚠️ {error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={create} disabled={saving}>
                {saving ? <span className="spinner" /> : '✓ Criar Curso'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
              O curso será criado com 16 aulas em branco para você preencher.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
