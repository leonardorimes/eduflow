'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem { href: string; icon: string; label: string; }

interface SidebarProps {
  role: 'admin' | 'student';
  userName: string;
  userEmail: string;
}

const adminNav: NavItem[] = [
  { href: '/admin', icon: '🏠', label: 'Dashboard' },
  { href: '/admin/courses', icon: '📚', label: 'Cursos' },
  { href: '/admin/students', icon: '👥', label: 'Alunos' },
];

const studentNav: NavItem[] = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/courses', icon: '📚', label: 'Meus Cursos' },
];

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === 'admin' ? adminNav : studentNav;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const initials = userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <div>
          <h1>EduFlow</h1>
          <span>{role === 'admin' ? 'Administrador' : 'Aluno'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu</span>
        {navItems.map(item => {
          const isActive = item.href === '/'
            ? pathname === item.href
            : pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin') && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div className="avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}
