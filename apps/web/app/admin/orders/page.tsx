'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Suspense } from 'react';

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Menunggu Bayar',
  QUEUED: 'Di Queue',
  BINDING: 'Sedang Diproduksi',
  SHIPPED: 'Dikirim',
  CANCELLED: 'Dibatalkan',
};
const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  BINDING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Order {
  id: string;
  order_number: string;
  status: string;
  user: { id: string; email: string; name: string };
  total: number;
  items_count: number;
  zip_url: string | null;
  created_at: string;
}

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [updating, setUpdating] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<string | null>(null);

  const perPage = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/orders?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error.message); return; }
        setOrders(d.orders);
        setTotal(d.total);
      })
      .catch(() => setError('Tidak bisa memuat orders'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message ?? 'Update gagal');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: d.status } : o));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update gagal');
    } finally {
      setUpdating(null);
    }
  };

  const downloadZip = async (orderId: string) => {
    setDownloadReady(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/zip`, { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message ?? 'ZIP belum siap');
      window.open(d.zip_url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download gagal');
    } finally {
      setDownloadReady(null);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{total} order ditemukan</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-3 py-2 border border-brand-300 text-brand-700 rounded-lg text-sm hover:bg-brand-50">
            Logout
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Tidak ada order
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-brand-700">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{order.user.name}</div>
                      <div className="text-gray-400 text-xs">{order.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.items_count}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(order.total)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Status transitions */}
                        {order.status === 'AWAITING_PAYMENT' && (
                          <button onClick={() => updateStatus(order.id, 'QUEUED')}
                            disabled={updating === order.id}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50">
                            {updating === order.id ? '...' : 'Konfirmasi Bayar'}
                          </button>
                        )}
                        {order.status === 'QUEUED' && (
                          <button onClick={() => updateStatus(order.id, 'BINDING')}
                            disabled={updating === order.id}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50">
                            {updating === order.id ? '...' : 'Mulai Produksi'}
                          </button>
                        )}
                        {order.status === 'BINDING' && (
                          <button onClick={() => updateStatus(order.id, 'SHIPPED')}
                            disabled={updating === order.id}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50">
                            {updating === order.id ? '...' : 'Tandai Dikirim'}
                          </button>
                        )}
                        {['AWAITING_PAYMENT', 'QUEUED', 'BINDING'].includes(order.status) && (
                          <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                            disabled={updating === order.id}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50">
                            Batalkan
                          </button>
                        )}
                        {/* ZIP download */}
                        {order.zip_url && (
                          <button onClick={() => downloadZip(order.id)}
                            disabled={downloadReady === order.id}
                            className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded hover:bg-brand-200 disabled:opacity-50">
                            {downloadReady === order.id ? '...' : '↓ ZIP'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Halaman {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Memuat...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
