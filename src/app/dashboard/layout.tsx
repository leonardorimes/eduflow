import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'admin') redirect('/admin');
  return (
    <div className="app-layout">
      <Sidebar role="student" userName={user.name} userEmail={user.email} />
      <main className="main-content">{children}</main>
    </div>
  );
}
