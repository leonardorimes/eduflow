'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import LessonPlayer from '@/components/LessonPlayer';
import Link from 'next/link';

interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface LessonSection { videoUrl: string; videoType: string; duration: number; description: string; }
interface Lesson { id: string; title: string; order: number; theory: LessonSection; practice: LessonSection; quiz: QuizQuestion[]; }
interface Course { id: string; title: string; thumbnail: string; lessons: Lesson[]; }
interface Progress { lessonId: string; quizPassed: boolean; quizScore: number | null; }

export default function LessonPageWrapper() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progressList, setProgressList] = useState<Progress[]>([]);

  const loadProgress = useCallback(async () => {
    // Single API call to get all progress for this course
    const res = await fetch(`/api/courses/${courseId}/progress`);
    if (res.ok) {
      const data: Progress[] = await res.json();
      setProgressList(data);
    }
  }, [courseId]);

  const load = useCallback(async () => {
    const cRes = await fetch(`/api/courses/${courseId}`);
    const c: Course = await cRes.json();
    setCourse(c);
    const l = c.lessons?.find((x: Lesson) => x.id === lessonId);
    setLesson(l || null);
    await loadProgress();
  }, [courseId, lessonId, loadProgress]);

  useEffect(() => { load(); }, [load]);

  if (!course || !lesson) return (
    <div className="page-content">
      <div className="animate-pulse" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
        Carregando aula...
      </div>
    </div>
  );

  function getLessonStatus(l: Lesson) {
    const p = progressList.find(pr => pr.lessonId === l.id);
    if (p?.quizPassed) return 'completed';
    if (l.order === 1) return 'available';
    const prev = course!.lessons.find(x => x.order === l.order - 1);
    if (!prev) return 'available';
    const prevP = progressList.find(pr => pr.lessonId === prev.id);
    return prevP?.quizPassed ? 'available' : 'locked';
  }

  const nextLesson = course.lessons.find(l => l.order === lesson.order + 1);

  return (
    <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px', alignItems: 'start' }}>
      {/* Main lesson content */}
      <div>
        <LessonPlayer
          lesson={lesson}
          courseId={courseId}
          nextLessonAvailable={!!nextLesson}
          onBack={() => router.push(`/dashboard/courses/${courseId}`)}
          onProgressUpdate={loadProgress}
        />
      </div>

      {/* Sidebar — lesson list */}
      <div style={{ position: 'sticky', top: '80px' }}>
        <div className="card card-sm" style={{ marginBottom: '12px' }}>
          <Link
            href={`/dashboard/courses/${courseId}`}
            style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← {course.thumbnail} {course.title}
          </Link>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', padding: '0 4px' }}>
          Aulas
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {course.lessons.map(l => {
            const status = getLessonStatus(l);
            const isActive = l.id === lessonId;

            const itemStyle: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: 'var(--radius-md)',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              opacity: status === 'locked' ? 0.4 : 1,
              transition: 'all 0.15s',
              cursor: status === 'locked' ? 'not-allowed' : 'pointer',
            };

            const numberStyle: React.CSSProperties = {
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              background: status === 'completed' ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700,
              color: status === 'completed' ? 'var(--success)' : isActive ? 'var(--accent-light)' : 'var(--text-muted)',
            };

            const label = (
              <>
                <div style={numberStyle}>
                  {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : l.order}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.title}
                  </div>
                </div>
              </>
            );

            if (status === 'locked' || isActive) {
              return <div key={l.id} style={itemStyle}>{label}</div>;
            }

            return (
              <Link
                key={l.id}
                href={`/dashboard/courses/${courseId}/lessons/${l.id}`}
                style={{ ...itemStyle, textDecoration: 'none' }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
