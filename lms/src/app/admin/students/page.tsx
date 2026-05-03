'use client';
import { useState, useEffect, useCallback } from 'react';

interface Course { id: string; title: string; thumbnail: string; category: string; }
interface Student { id: string; name: string; email: string; enrolledCourses: string[]; createdAt: string; }

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', enrolledCourses: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [usersRes, coursesRes] = await Promise.all([fetch('/api/users'), fetch('/api/courses')]);
    const users = await usersRes.json();
    const cs = await coursesRes.json();
    setStudents(users.filter((u: Student & { role: string }) => u.role === 'student'));
    setCourses(cs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createStudent() {
    if (!form.name || !form.email || !form.password) { setError('Nome, email e senha obrigatórios'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'student' }) });
    if (res.ok) { setShowModal(false); setForm({ name: '', email: '', password: '', enrolledCourses: [] }); load(); }
    else { const d = await res.json(); setError(d.error || 'Erro ao criar aluno'); }
    setSaving(false);
  }

  async function updateEnrollment(studentId: string, courseIds: string[]) {
    setSaving(true);
    await fetch(`/api/users/${studentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrolledCourses: courseIds }) });
    setSaving(false);
    setShowEnrollModal(null);
    load();
  }

  async function deleteStudent(id: string) {
    if (!confirm('Excluir este aluno?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    load();
  }

  function toggleCourseInForm(courseId: string) {
    setForm(f => ({ ...f, enrolledCourses: f.enrolledCourses.includes(courseId) ? f.enrolledCourses.filter(c => c !== courseId) : [...f.enrolledCourses, courseId] }));
  }

  const [enrollIds, setEnrollIds] = useState<string[]>([]);
  function openEnrollModal(student: Student) {
    setEnrollIds(student.enrolledCourses);
    setShowEnrollModal(student);
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Gerenciar Alunos</h2>
          <p className="page-subtitle">{students.length} aluno(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Matricular Aluno</button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="animate-pulse">Carregando...</div></div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👤</div>
          <h3>Nenhum aluno cadastrado</h3>
          <p>Matricule o primeiro aluno clicando no botão acima</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Email</th>
                <th>Cursos Matriculado</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {s.enrolledCourses.length === 0 ? (
                        <span className="badge badge-gray">Nenhum</span>
                      ) : s.enrolledCourses.map(cid => {
                        const c = courses.find(x => x.id === cid);
                        return c ? <span key={cid} className="badge badge-blue">{c.thumbnail} {c.title}</span> : null;
                      })}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEnrollModal(s)}>📚 Cursos</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Matricular Novo Aluno</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input className="form-input" placeholder="Nome do aluno" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha inicial *</label>
              <input className="form-input" type="password" placeholder="Senha para o aluno" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            {courses.length > 0 && (
              <div className="form-group">
                <label className="form-label">Matricular em Curso(s)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {courses.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: 'var(--radius-md)', background: form.enrolledCourses.includes(c.id) ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', border: `1px solid ${form.enrolledCourses.includes(c.id) ? 'var(--accent)' : 'var(--border)'}` }}>
                      <input type="checkbox" checked={form.enrolledCourses.includes(c.id)} onChange={() => toggleCourseInForm(c.id)} />
                      <span>{c.thumbnail}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="form-error" style={{ marginBottom: '12px' }}>⚠️ {error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={createStudent} disabled={saving}>
                {saving ? <span className="spinner" /> : '✓ Matricular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEnrollModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Cursos de {showEnrollModal.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEnrollModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Selecione os cursos em que este aluno deve estar matriculado:
            </p>
            {courses.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>Nenhum curso disponível. Crie cursos primeiro.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {courses.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: 'var(--radius-md)', background: enrollIds.includes(c.id) ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', border: `1px solid ${enrollIds.includes(c.id) ? 'var(--accent)' : 'var(--border)'}` }}>
                    <input type="checkbox" checked={enrollIds.includes(c.id)} onChange={() => setEnrollIds(ids => ids.includes(c.id) ? ids.filter(i => i !== c.id) : [...ids, c.id])} />
                    <span style={{ fontSize: '20px' }}>{c.thumbnail}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.category}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEnrollModal(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => updateEnrollment(showEnrollModal.id, enrollIds)} disabled={saving}>
                {saving ? <span className="spinner" /> : '✓ Salvar Matrículas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
