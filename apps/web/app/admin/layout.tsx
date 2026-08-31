'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = (session?.user as { role?: string })?.role;
  if (role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header className="bg-brand-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="text-xl font-serif font-bold">Booxury</a>
            <span className="text-xs bg-brand-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/admin/orders" className="hover:text-brand-200 transition-colors">Orders</a>
            <a href="/" className="hover:text-brand-200 transition-colors">Lihat Situs</a>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
