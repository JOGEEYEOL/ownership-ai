import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getUserRole } from '@/lib/auth/roles';

/**
 * Admin Layout
 * - Dark sidebar navigation
 * - Admin role verification (server-side, DB-based)
 * - Redirect to home if not admin
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side admin check
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login?redirect=/admin');
  }

  // DB 기반 역할 체크 (user_roles 테이블)
  const userRoleInfo = await getUserRole(user.id);
  const isAdmin = userRoleInfo.role.name === 'admin';

  if (!isAdmin) {
    redirect('/'); // Redirect non-admin users to home
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
