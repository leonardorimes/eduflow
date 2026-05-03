'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'admin'>('student');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao fazer login'); return; }
      if (data.user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">🎓</div>
          <h1>EduFlow</h1>
          <p>Plataforma de Ensino Online</p>
        </div>

        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button className={`tab ${role === 'student' ? 'active' : ''}`} onClick={() => { setRole('student'); setEmail(''); setPassword(''); setError(''); }}>
            👤 Aluno
          </button>
          <button className={`tab ${role === 'admin' ? 'active' : ''}`} onClick={() => { setRole('admin'); setEmail('admin@escola.com'); setPassword('admin123'); setError(''); }}>
            ⚙️ Admin
          </button>
        </div>

        {role === 'admin' && (
          <div className="card card-sm" style={{ marginBottom: '16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <p style={{ fontSize: '12px', color: 'var(--blue-300)' }}>
              🔑 <strong>Acesso Admin padrão:</strong><br />
              Email: <code>admin@escola.com</code><br />
              Senha: <code>admin123</code>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="form-error" style={{ marginBottom: '12px' }}>⚠️ {error}</p>}
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? <span className="spinner" /> : `Entrar como ${role === 'admin' ? 'Administrador' : 'Aluno'}`}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
          💡 <strong>Primeiro acesso?</strong> O admin padrão já está configurado. Use as credenciais acima para entrar e cadastrar seus alunos.
        </div>
      </div>
    </div>
  );
}
