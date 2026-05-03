import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CourseOverviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const course = db.courses.findById(courseId);
  if (!course || !user!.enrolledCourses.includes(courseId)) redirect('/dashboard');

  const progressList = db.progress.findByUserAndCourse(user!.id, courseId);

  function getLessonStatus(lessonId: string, order: number) {
    const p = progressList.find(p => p.lessonId === lessonId);
    if (p?.quizPassed) return 'completed';
    if (order === 1) return 'available';
    const prevLesson = course!.lessons.find(l => l.order === order - 1);
    if (!prevLesson) return 'available';
    const prevP = progressList.find(p => p.lessonId === prevLesson.id);
    return prevP?.quizPassed ? 'available' : 'locked';
  }

  const completedCount = progressList.filter(p => p.quizPassed).length;
  const pct = Math.round((completedCount / 16) * 100);

  return (
    <div className="page-content">
      <Link href="/dashboard" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: 'block' }}>← Voltar ao Dashboard</Link>

      {/* Course header */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '48px' }}>{course!.thumbnail || '📚'}</span>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{course!.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{course!.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-light)', minWidth: '60px' }}>{completedCount}/16 aulas</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: pct === 100 ? 'var(--success)' : 'var(--text-primary)' }}>{pct}%</span>
        </div>
      </div>

      {/* Lessons */}
      <div className="section-title" style={{ marginBottom: '16px' }}>📋 Aulas do Curso</div>
      <div className="lesson-list">
        {course!.lessons.map(lesson => {
          const status = getLessonStatus(lesson.id, lesson.order);
          const p = progressList.find(pr => pr.lessonId === lesson.id);
          const lessonHref = `/dashboard/courses/${courseId}/lessons/${lesson.id}`;

          const inner = (
            <>
              <div className="lesson-number">
                {status === 'completed' ? '✅' : status === 'locked' ? '🔒' : lesson.order}
              </div>
              <div className="lesson-item-info">
                <div className="lesson-item-title">{lesson.title}</div>
                <div className="lesson-item-meta">
                  {status === 'locked'
                    ? 'Complete a aula anterior para desbloquear'
                    : status === 'completed'
                    ? `Concluída • Quiz: ${p?.quizScore ?? 0}/10`
                    : 'Disponível para estudo'}
                </div>
              </div>
              <div className="lesson-status">
                {status === 'locked'
                  ? <span className="badge badge-gray">Bloqueada</span>
                  : status === 'completed'
                  ? <span className="badge badge-green">Concluída</span>
                  : <span className="badge badge-blue">Estudar →</span>}
              </div>
            </>
          );

          if (status === 'locked') {
            return (
              <div key={lesson.id} className="lesson-item locked" style={{ cursor: 'not-allowed' }}>
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={lesson.id}
              href={lessonHref}
              className={`lesson-item ${status === 'completed' ? 'completed' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
