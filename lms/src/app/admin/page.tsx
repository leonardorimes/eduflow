import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminPage() {
  const users = db.users.getAll();
  const courses = db.courses.getAll();
  const students = users.filter(u => u.role === 'student');
  const allProgress = db.progress.getAll();

  const completedLessons = allProgress.filter(p => p.quizPassed).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Dashboard Administrativo</h2>
        <p className="page-subtitle">Visão geral da plataforma</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">Alunos cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Cursos criados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{completedLessons}</div>
          <div className="stat-label">Aulas concluídas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{students.reduce((a, s) => a + s.enrolledCourses.length, 0)}</div>
          <div className="stat-label">Matrículas ativas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="section-header">
            <span className="section-title">📚 Cursos Recentes</span>
            <Link href="/admin/courses" className="section-link">Ver todos →</Link>
          </div>
          {courses.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="icon">📭</div>
              <h3>Nenhum curso criado</h3>
              <p>Crie o primeiro curso</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {courses.slice(0, 4).map(c => (
                <Link key={c.id} href={`/admin/courses/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '24px' }}>{c.thumbnail || '📖'}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.lessons.length} aulas • {c.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <span className="section-title">👥 Alunos Recentes</span>
            <Link href="/admin/students" className="section-link">Ver todos →</Link>
          </div>
          {students.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="icon">👤</div>
              <h3>Nenhum aluno cadastrado</h3>
              <p>Matricule o primeiro aluno</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {students.slice(0, 4).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                  <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                    {s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.enrolledCourses.length} curso(s)</div>
                  </div>
                  <span className="badge badge-blue">{s.enrolledCourses.length} curso{s.enrolledCourses.length !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="section-title" style={{ marginBottom: '16px' }}>⚡ Ações Rápidas</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/courses" className="btn btn-primary">📚 Criar Novo Curso</Link>
          <Link href="/admin/students" className="btn btn-secondary">👤 Matricular Aluno</Link>
        </div>
      </div>
    </div>
  );
}
