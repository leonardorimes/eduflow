'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; }
interface LessonSection { videoUrl: string; videoType: string; duration: number; description: string; }
interface Lesson { id: string; title: string; order: number; theory: LessonSection; practice: LessonSection; quiz: QuizQuestion[]; }
interface Progress { theoryCompleted: boolean; theoryWatchedSeconds: number; practiceCompleted: boolean; practiceWatchedSeconds: number; quizScore: number | null; quizPassed: boolean; completedAt?: string | null; }

function getEmbedUrl(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&rel=0&modestbranding=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;
  }
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?api=1`;
  return url;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function VideoSection({ videoUrl, duration, onProgress, onComplete, completed, watchedSeconds }:
  { videoUrl: string; duration: number; onProgress: (s: number) => void; onComplete: () => void; completed: boolean; watchedSeconds: number; }) {
  const [localWatched, setLocalWatched] = useState(watchedSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const completedRef = useRef(completed);
  const isYT = isYouTubeUrl(videoUrl);

  useEffect(() => { completedRef.current = completed; }, [completed]);

  useEffect(() => {
    setLocalWatched(watchedSeconds);
  }, [watchedSeconds]);

  const startTimer = useCallback(() => {
    if (completedRef.current) return;
    if (intervalRef.current) return;
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setLocalWatched(prev => {
        const next = prev + 1;
        onProgress(next);
        if (next >= duration && !completedRef.current) {
          onComplete();
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        }
        return next;
      });
    }, 1000);
  }, [duration, onComplete, onProgress]);

  const stopTimer = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  // Listen to YouTube IFrame API postMessage events
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      let data: Record<string, unknown> | null = null;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data) return;

      // YouTube IFrame API events
      if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
        const info = data.info as any;
        if (info.playerState !== undefined) {
          const state = info.playerState;
          if (state === 1) startTimer();
          else if (state === 0) { stopTimer(); if (!completedRef.current) onComplete(); }
          else stopTimer();
        }
      }

      if (typeof data.event === 'string' && data.event === 'onStateChange') {
        const state = data.info as number;
        if (state === 1) startTimer();        // PLAYING
        else if (state === 0) {               // ENDED
          stopTimer();
          if (!completedRef.current) onComplete();
        } else {
          stopTimer();                        // PAUSED / BUFFERING / etc
        }
        return;
      }

      // Vimeo player API events
      if (data.event === 'play') { startTimer(); return; }
      if (data.event === 'pause' || data.event === 'finish') { stopTimer(); return; }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isYT, startTimer, stopTimer, onComplete]);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      if (isYT) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
          '*'
        );
      } else {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'play' }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'pause' }), '*');
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: 'finish' }), '*');
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const pct = Math.min(100, Math.round((localWatched / duration) * 100));
  const embedUrl = getEmbedUrl(videoUrl);
  const mins = Math.floor(localWatched / 60);
  const secs = localWatched % 60;
  const totalMins = Math.floor(duration / 60);
  const totalSecs = duration % 60;

  if (!videoUrl) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📹</div>
        <p style={{ color: 'var(--text-muted)' }}>Vídeo não configurado para esta aula.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="video-wrapper" style={{ position: 'relative' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Aula"
          onLoad={handleIframeLoad}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
        {/* Live recording indicator */}
        {!completed && playing && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.72)', padding: '4px 12px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>Registrando...</span>
          </div>
        )}
      </div>
      <div className="watch-progress" style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {mins}:{String(secs).padStart(2,'0')} / {totalMins}:{String(totalSecs).padStart(2,'0')}
        </div>
        <div className="watch-progress-bar"><div className="watch-progress-fill" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: completed ? 'var(--success)' : playing ? '#f59e0b' : 'var(--accent-light)', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
          {completed ? '✅ Completo' : playing ? `▶ ${pct}%` : `${pct}%`}
        </div>
      </div>
      {!completed && (
        <div style={{ marginTop: '8px', padding: '10px 14px', background: playing ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: playing ? '#fcd34d' : 'var(--blue-300)', transition: 'all 0.3s' }}>
          {playing
            ? '⏱️ Contagem em andamento — pause ou finalize o vídeo para salvar.'
            : `▶️ Dê play no vídeo para iniciar a contagem automática. Você precisa assistir ${totalMins}m${String(totalSecs).padStart(2, '0')}s para avançar.`}
        </div>
      )}
    </div>
  );
}

function QuizSection({ questions, onPass }: { questions: QuizQuestion[]; onPass: (score: number) => void; }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const PASS_SCORE = 7;

  function handleSelect(optIdx: number) {
    if (showAnswer) return;
    setSelected(optIdx);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setShowAnswer(true);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setAnswers(newAnswers);
        setCurrent(c => c + 1);
        setSelected(null);
        setShowAnswer(false);
      } else {
        const s = newAnswers.filter((a, i) => a === questions[i].correctIndex).length;
        setScore(s);
        setShowResult(true);
        if (s >= PASS_SCORE) onPass(s);
      }
    }, 1200);
  }

  function restart() {
    setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false); setShowAnswer(false); setScore(0);
  }

  if (showResult) {
    const passed = score >= PASS_SCORE;
    return (
      <div className="quiz-result">
        <div className="quiz-score" style={{ color: passed ? 'var(--success)' : 'var(--error)' }}>{score}/10</div>
        <div className="quiz-result-msg">{passed ? '🎉 Parabéns! Você passou!' : '😔 Tente novamente'}</div>
        <div className="quiz-result-sub">
          {passed ? 'Você acertou suficiente para avançar para a próxima aula!' : `Você precisa acertar pelo menos ${PASS_SCORE} questões. Acertou ${score}.`}
        </div>
        {!passed && <button className="btn btn-primary" onClick={restart}>🔄 Tentar Novamente</button>}
        {passed && <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#6ee7b7', fontSize: '14px' }}>✅ Próxima aula desbloqueada!</div>}
      </div>
    );
  }

  const q = questions[current];
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="quiz-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="quiz-question-count">Questão {current + 1} de {questions.length}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meta: {PASS_SCORE}/10 para passar</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: '24px' }}>
        <div className="progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-question-text">{q.question}</div>
      <div className="quiz-options">
        {q.options.map((opt, oi) => {
          let cls = 'quiz-option';
          if (showAnswer) {
            if (oi === q.correctIndex) cls += ' correct';
            else if (oi === selected) cls += ' wrong';
          } else if (oi === selected) cls += ' selected';
          return (
            <button key={oi} className={cls} onClick={() => handleSelect(oi)} disabled={showAnswer}>
              <span className="quiz-option-letter">{letters[oi]}</span>
              {opt}
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleNext} disabled={selected === null || showAnswer}>
        {current < questions.length - 1 ? 'Próxima →' : 'Finalizar Quiz'}
      </button>
    </div>
  );
}

export default function LessonPage({ lesson, courseId, nextLessonAvailable, onBack, onProgressUpdate }:
  { lesson: Lesson; courseId: string; nextLessonAvailable: boolean; onBack: () => void; onProgressUpdate?: () => void; }) {
  const [progress, setProgress] = useState<Progress>({
    theoryCompleted: false, theoryWatchedSeconds: 0,
    practiceCompleted: false, practiceWatchedSeconds: 0,
    quizScore: null, quizPassed: false,
  });
  const [tab, setTab] = useState<'theory' | 'practice' | 'quiz'>('theory');
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}/progress`);
    if (res.ok) {
      const data = await res.json();
      if (data) setProgress(data);
    }
    setLoading(false);
  }, [courseId, lesson.id]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  async function saveProgress(updates: Partial<Progress>) {
    const updated = { ...progress, ...updates };
    setProgress(updated);
    await fetch(`/api/courses/${courseId}/lessons/${lesson.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    // Notify parent to refresh sidebar progress
    if (updates.quizPassed && onProgressUpdate) onProgressUpdate();
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando aula...</div>;

  const canAccessPractice = progress.theoryCompleted;
  const canAccessQuiz = progress.practiceCompleted;

  return (
    <div>
      {/* Lesson header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Voltar</button>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{lesson.title}</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aula {lesson.order} de 16</div>
        </div>
        {progress.quizPassed && <span className="badge badge-green">✅ Concluída</span>}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'theory' ? 'active' : ''}`} onClick={() => setTab('theory')}>
          📹 Teoria {progress.theoryCompleted ? '✅' : ''}
        </button>
        <button className={`tab ${tab === 'practice' ? 'active' : ''} ${!canAccessPractice ? 'locked-tab' : ''}`}
          onClick={() => { if (canAccessPractice) setTab('practice'); }}
          style={{ opacity: canAccessPractice ? 1 : 0.4, cursor: canAccessPractice ? 'pointer' : 'not-allowed' }}>
          💪 Prática {progress.practiceCompleted ? '✅' : canAccessPractice ? '' : '🔒'}
        </button>
        <button className={`tab ${tab === 'quiz' ? 'active' : ''}`}
          onClick={() => { if (canAccessQuiz) setTab('quiz'); }}
          style={{ opacity: canAccessQuiz ? 1 : 0.4, cursor: canAccessQuiz ? 'pointer' : 'not-allowed' }}>
          🧠 Quiz {progress.quizPassed ? '✅' : canAccessQuiz ? '' : '🔒'}
        </button>
      </div>

      {/* Theory */}
      {tab === 'theory' && (
        <div>
          <VideoSection
            videoUrl={lesson.theory.videoUrl}
            duration={lesson.theory.duration}
            watchedSeconds={progress.theoryWatchedSeconds}
            completed={progress.theoryCompleted}
            onProgress={s => setProgress(p => ({ ...p, theoryWatchedSeconds: s }))}
            onComplete={() => saveProgress({ theoryCompleted: true, theoryWatchedSeconds: lesson.theory.duration })}
          />
          {lesson.theory.description && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>📝 Material da Aula</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{lesson.theory.description}</p>
            </div>
          )}
          {progress.theoryCompleted && !canAccessPractice && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setTab('practice')}>
                💪 Avançar para Prática →
              </button>
            </div>
          )}
          {progress.theoryCompleted && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ color: '#6ee7b7', fontSize: '14px' }}>✅ Teoria concluída! Vá para a aba Prática.</span>
            </div>
          )}
        </div>
      )}

      {/* Practice */}
      {tab === 'practice' && canAccessPractice && (
        <div>
          <VideoSection
            videoUrl={lesson.practice.videoUrl}
            duration={lesson.practice.duration}
            watchedSeconds={progress.practiceWatchedSeconds}
            completed={progress.practiceCompleted}
            onProgress={s => setProgress(p => ({ ...p, practiceWatchedSeconds: s }))}
            onComplete={() => saveProgress({ practiceCompleted: true, practiceWatchedSeconds: lesson.practice.duration })}
          />
          {lesson.practice.description && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>📝 Material da Prática</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{lesson.practice.description}</p>
            </div>
          )}
          {progress.practiceCompleted && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setTab('quiz')}>
                🧠 Ir para o Quiz →
              </button>
            </div>
          )}
        </div>
      )}
      {tab === 'practice' && !canAccessPractice && (
        <div className="empty-state">
          <div className="icon">🔒</div>
          <h3>Complete a Teoria primeiro</h3>
          <p>Assista ao vídeo de teoria para desbloquear a prática.</p>
          <button className="btn btn-primary mt-4" onClick={() => setTab('theory')}>← Ir para Teoria</button>
        </div>
      )}

      {/* Quiz */}
      {tab === 'quiz' && canAccessQuiz && !progress.quizPassed && (
        <QuizSection
          questions={lesson.quiz}
          onPass={score => saveProgress({ quizScore: score, quizPassed: true, completedAt: new Date().toISOString() })}
        />
      )}
      {tab === 'quiz' && canAccessQuiz && progress.quizPassed && (
        <div className="quiz-result">
          <div className="quiz-score" style={{ color: 'var(--success)' }}>{progress.quizScore}/10</div>
          <div className="quiz-result-msg">🎉 Quiz já concluído!</div>
          <div className="quiz-result-sub">Você passou nesta aula com {progress.quizScore} acertos.</div>
          <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#6ee7b7', fontSize: '14px' }}>
            ✅ Próxima aula desbloqueada!
          </div>
        </div>
      )}
      {tab === 'quiz' && !canAccessQuiz && (
        <div className="empty-state">
          <div className="icon">🔒</div>
          <h3>Complete a Prática primeiro</h3>
          <p>Assista ao vídeo de prática para desbloquear o quiz.</p>
          <button className="btn btn-primary mt-4" onClick={() => setTab(canAccessPractice ? 'practice' : 'theory')}>← Voltar</button>
        </div>
      )}
    </div>
  );
}
