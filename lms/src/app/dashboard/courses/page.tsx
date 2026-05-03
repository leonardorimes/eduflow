import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function StudentCoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const allCourses = db.courses.getAll();
  const enrolled = allCourses.filter(c => user.enrolledCourses.includes(c.id));

  function getProgress(courseId: string) {
    const progress = db.progress.findByUserAndCourse(user!.id, courseId);
    const passed = progress.filter(p => p.quizPassed).length;
    return { completed: passed, pct: Math.round((passed / 16) * 100) };
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-title">Meus Cursos</h2>
        <p className="page-subtitle">{enrolled.length} curso(s) matriculado(s)</p>
      </div>
      {enrolled.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Nenhum curso ainda</h3>
          <p>Aguarde o administrador matriculá-lo.</p>
        </div>
      ) : (
        <div className="course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {enrolled.map(c => {
            const prog = getProgress(c.id);
            return (
              <Link key={c.id} href={`/dashboard/courses/${c.id}`} className="course-card">
                <div className="course-thumbnail">
                  <div className="course-thumbnail-placeholder" style={{ fontSize: '48px' }}>{c.thumbnail || '📚'}</div>
                  <div className="course-progress-bar"><div className="course-progress-fill" style={{ width: `${prog.pct}%` }} /></div>
                </div>
                <div className="course-card-body">
                  <div className="course-card-title" style={{ fontSize: '15px' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.category}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge badge-blue">{prog.completed}/16 aulas</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: prog.pct === 100 ? 'var(--success)' : 'var(--accent-light)' }}>{prog.pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${prog.pct}%` }} /></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
