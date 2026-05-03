import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const allCourses = db.courses.getAll();
  const enrolledCourses = allCourses.filter(c => user.enrolledCourses.includes(c.id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  function getCourseProgress(courseId: string) {
    const progress = db.progress.findByUserAndCourse(user!.id, courseId);
    const passed = progress.filter(p => p.quizPassed).length;
    return { completed: passed, total: 16, pct: Math.round((passed / 16) * 100) };
  }

  function getCurrentLesson(courseId: string) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return 1;
    for (let i = 0; i < course.lessons.length; i++) {
      const p = db.progress.findByUserCourseLesson(user!.id, courseId, course.lessons[i].id);
      if (!p?.quizPassed) return i + 1;
    }
    return 16;
  }

  return (
    <div className="page-content">
      {/* Hero greeting */}
      <div style={{ textAlign: 'center', marginBottom: '40px', padding: '40px 20px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
          {greeting}, <span style={{ background: 'linear-gradient(135deg, var(--blue-400), var(--blue-200))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.name.split(' ')[0]}</span> 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Continue de onde parou e conquiste seus objetivos.</p>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎓</div>
          <h3>Nenhum curso ativo</h3>
          <p>Aguarde o administrador matriculá-lo em um curso.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-value">{enrolledCourses.length}</div>
              <div className="stat-label">Cursos Matriculados</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{enrolledCourses.reduce((acc, c) => acc + getCourseProgress(c.id).completed, 0)}</div>
              <div className="stat-label">Aulas Concluídas</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{Math.round(enrolledCourses.reduce((acc, c) => acc + getCourseProgress(c.id).pct, 0) / enrolledCourses.length)}%</div>
              <div className="stat-label">Progresso Médio</div>
            </div>
          </div>

          {/* Course tracks */}
          <div className="section-header">
            <span className="section-title">📚 Meus Cursos</span>
            <Link href="/dashboard/courses" className="section-link">Ver todos →</Link>
          </div>

          <div className="course-grid">
            {enrolledCourses.map(course => {
              const prog = getCourseProgress(course.id);
              const currentLesson = getCurrentLesson(course.id);
              return (
                <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="course-card">
                  <div className="course-thumbnail">
                    <div className="course-thumbnail-placeholder">{course.thumbnail || '📚'}</div>
                    <div className="course-progress-bar">
                      <div className="course-progress-fill" style={{ width: `${prog.pct}%` }} />
                    </div>
                  </div>
                  <div className="course-card-body">
                    <div className="course-card-title">{course.title}</div>
                    <div className="course-card-meta">
                      <span className="course-badge">Aula {currentLesson}/16</span>
                      <span style={{ marginLeft: 'auto' }}>{prog.pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginTop: '8px' }}>
                      <div className="progress-fill" style={{ width: `${prog.pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
