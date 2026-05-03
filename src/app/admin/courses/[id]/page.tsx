'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface LessonSection { videoUrl: string; videoType: string; duration: number; description: string; }
interface Lesson { id: string; title: string; order: number; theory: LessonSection; practice: LessonSection; quiz: QuizQuestion[]; }
interface Course { id: string; title: string; description: string; thumbnail: string; category: string; lessons: Lesson[]; }

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<'theory' | 'practice' | 'quiz'>('theory');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}`);
    const data = await res.json();
    setCourse(data);
    if (data.lessons?.length > 0) setSelectedLesson(data.lessons[0]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function updateLesson(field: string, value: unknown) {
    if (!selectedLesson || !course) return;
    const updated = { ...selectedLesson, [field]: value };
    setSelectedLesson(updated);
    setCourse(c => c ? { ...c, lessons: c.lessons.map(l => l.id === updated.id ? updated : l) } : c);
  }

  function updateSection(section: 'theory' | 'practice', field: string, value: string | number) {
    if (!selectedLesson) return;
    updateLesson(section, { ...selectedLesson[section], [field]: value });
  }

  function updateQuiz(qIdx: number, field: string, value: unknown) {
    if (!selectedLesson) return;
    const quiz = [...selectedLesson.quiz];
    quiz[qIdx] = { ...quiz[qIdx], [field]: value };
    updateLesson('quiz', quiz);
  }

  function updateQuizOption(qIdx: number, oIdx: number, value: string) {
    if (!selectedLesson) return;
    const quiz = [...selectedLesson.quiz];
    const options = [...quiz[qIdx].options];
    options[oIdx] = value;
    quiz[qIdx] = { ...quiz[qIdx], options };
    updateLesson('quiz', quiz);
  }

  async function saveCourse() {
    if (!course) return;
    setSaving(true);
    await fetch(`/api/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessons: course.lessons }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  if (!course) return <div className="page-content"><div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Carregando...</div></div>;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Link href="/admin/courses" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>← Voltar aos Cursos</Link>
          <h2 className="page-title">{course.thumbnail} {course.title}</h2>
          <p className="page-subtitle">Editando aulas e conteúdo do curso</p>
        </div>
        <button className="btn btn-primary" onClick={saveCourse} disabled={saving}>
          {saving ? <span className="spinner" /> : saved ? '✓ Salvo!' : '💾 Salvar Alterações'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
        {/* Lesson list */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>16 Aulas</div>
          <div className="lesson-list">
            {course.lessons.map(l => (
              <div key={l.id} className={`lesson-item ${selectedLesson?.id === l.id ? 'active' : ''}`}
                style={{ borderColor: selectedLesson?.id === l.id ? 'var(--accent)' : 'var(--border)', background: selectedLesson?.id === l.id ? 'rgba(59,130,246,0.1)' : 'var(--bg-card)' }}
                onClick={() => { setSelectedLesson(l); setTab('theory'); }}>
                <div className="lesson-number" style={{ background: selectedLesson?.id === l.id ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)', color: selectedLesson?.id === l.id ? 'var(--blue-300)' : 'var(--text-secondary)' }}>{l.order}</div>
                <div className="lesson-item-info">
                  <div className="lesson-item-title" style={{ fontSize: '12px' }}>{l.title}</div>
                  <div className="lesson-item-meta">
                    {l.theory.videoUrl ? '✅' : '⭕'} Teoria {l.practice.videoUrl ? '✅' : '⭕'} Prática
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {selectedLesson && (
          <div className="card">
            <div style={{ marginBottom: '16px' }}>
              <input className="form-input" style={{ fontSize: '16px', fontWeight: 600, background: 'transparent', border: 'none', padding: '0', borderBottom: '1px solid var(--border)', borderRadius: '0' }}
                value={selectedLesson.title}
                onChange={e => updateLesson('title', e.target.value)}
                placeholder={`Aula ${selectedLesson.order}`} />
            </div>

            <div className="tabs">
              <button className={`tab ${tab === 'theory' ? 'active' : ''}`} onClick={() => setTab('theory')}>📹 Teoria</button>
              <button className={`tab ${tab === 'practice' ? 'active' : ''}`} onClick={() => setTab('practice')}>💪 Prática</button>
              <button className={`tab ${tab === 'quiz' ? 'active' : ''}`} onClick={() => setTab('quiz')}>🧠 Quiz</button>
            </div>

            {(tab === 'theory' || tab === 'practice') && (
              <div>
                <div className="form-group">
                  <label className="form-label">URL do Vídeo (YouTube ou Vimeo)</label>
                  <input className="form-input" placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={tab === 'theory' ? selectedLesson.theory.videoUrl : selectedLesson.practice.videoUrl}
                    onChange={e => updateSection(tab, 'videoUrl', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duração mínima para completar (segundos)</label>
                  <input className="form-input" type="number" min="30"
                    value={tab === 'theory' ? selectedLesson.theory.duration : selectedLesson.practice.duration}
                    onChange={e => updateSection(tab, 'duration', Number(e.target.value))} />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    O aluno precisa assistir pelo menos essa quantidade de segundos para avançar.
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição / Materiais</label>
                  <textarea className="form-input form-textarea" placeholder="Descrição da aula, links de materiais..."
                    value={tab === 'theory' ? selectedLesson.theory.description : selectedLesson.practice.description}
                    onChange={e => updateSection(tab, 'description', e.target.value)} />
                </div>
              </div>
            )}

            {tab === 'quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--blue-300)' }}>
                  💡 O aluno precisa acertar 7 de 10 questões para avançar à próxima aula.
                </div>
                {selectedLesson.quiz.map((q, qi) => (
                  <div key={q.id} className="card card-sm" style={{ background: 'var(--bg-elevated)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Questão {qi + 1}</div>
                    <div className="form-group">
                      <input className="form-input" placeholder={`Pergunta ${qi + 1}`} value={q.question} onChange={e => updateQuiz(qi, 'question', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oi}
                            onChange={() => updateQuiz(qi, 'correctIndex', oi)}
                            title={`Marcar opção ${String.fromCharCode(65 + oi)} como correta`} />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '18px' }}>{String.fromCharCode(65 + oi)}</span>
                          <input className="form-input" style={{ flex: 1 }} placeholder={`Opção ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateQuizOption(qi, oi, e.target.value)} />
                          {q.correctIndex === oi && <span style={{ color: 'var(--success)', fontSize: '14px' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Selecione o botão radio da resposta correta
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
