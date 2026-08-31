'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { useConfiguratorStore } from '../../lib/stores/configurator';

const fmt = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function CheckoutConfirmPage() {
  const router = useRouter();
  const { cart, clearCart } = useConfiguratorStore();
  const [state, setState] = useState<'review' | 'paying' | 'success'>('review');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setError(null);
    setState('paying');
    try {
      setOrderNumber(`BX-${Date.now().toString(36).toUpperCase()}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearCart();
      setState('success');
    } catch (caughtError) {
      console.error(caughtError);
      setError('Checkout gagal. Silakan coba lagi.');
      setState('review');
    }
  };

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-brand-50">
        <CheckoutHeader current="checkout" />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="border-y border-brand-900 py-12 sm:py-16">
            <svg className="mx-auto h-10 w-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m4.75 12.5 4.25 4.25L19.5 6.25" /></svg>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Pesanan diterima</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.045em] text-brand-900 sm:text-5xl">Buku Anda masuk antrean.</h1>
            <p className="mt-5 text-sm leading-relaxed text-brand-600">Nomor pesanan demo Anda</p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-[0.08em] text-brand-900 sm:text-3xl">{orderNumber}</p>
            <p className="mx-auto mt-7 max-w-xl text-sm leading-relaxed text-brand-600">Pembayaran demo berhasil. Pada alur produksi, tim akan melanjutkan proof dan menyiapkan berkas cetak setelah pesanan dikonfirmasi.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/customize/base" className="inline-flex items-center justify-center gap-2 bg-brand-900 px-5 py-3 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700">Desain lagi <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              <Link href="/" className="inline-flex items-center justify-center border border-brand-300 px-5 py-3 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-900">Kembali ke beranda</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-brand-50">
        <CheckoutHeader current="cart" />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Checkout</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.045em] text-brand-900">Keranjang masih kosong.</h1>
          <p className="mt-4 text-sm text-brand-600">Pilih spesifikasi buku terlebih dahulu untuk melanjutkan.</p>
          <Link href="/customize/base" className="mt-8 inline-flex items-center gap-2 bg-brand-900 px-5 py-3 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700">Mulai desain <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <CheckoutHeader current="checkout" />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Konfirmasi akhir</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.045em] text-brand-900 sm:text-5xl">Satu langkah menuju produksi.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-600">Periksa desain dan total pesanan Anda sebelum menjalankan pembayaran demo.</p>

            <section className="mt-10 border-y border-brand-300 py-6">
              <h2 className="font-serif text-2xl font-bold text-brand-900">Ringkasan pesanan</h2>
              <dl className="mt-5 divide-y divide-brand-300 border-t border-brand-300">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-5 py-4 text-sm">
                    <dt><span className="block font-semibold text-brand-900">{item.size} Hardcover</span><span className="mt-1 block text-brand-600">{item.pages} halaman · spine {item.spineWidthMm} mm</span></dt>
                    <dd className="font-medium text-brand-900">{fmt(item.price)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-8 border-l-2 border-accent-500 bg-brand-100 px-5 py-4" aria-label="Informasi pembayaran demo">
              <div className="flex gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8.25v4.5m0 3h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="text-sm leading-relaxed text-brand-700">Mode demo aktif: pembayaran akan berhasil tanpa biaya. Dalam produksi, tahap ini akan terhubung ke gateway pembayaran.</p>
              </div>
            </section>

            {error && <p role="alert" className="mt-6 border-l-2 border-[#7c252b] bg-[#f7e7e6] px-4 py-3 text-sm text-[#651b22]">{error}</p>}
          </div>

          <aside className="h-fit border-y border-brand-900 py-6 lg:sticky lg:top-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Pembayaran demo</p>
            <dl className="mt-6 space-y-4 text-sm text-brand-600">
              <div className="flex justify-between gap-5"><dt>Subtotal</dt><dd>{fmt(total)}</dd></div>
              <div className="flex justify-between gap-5"><dt>Pengiriman</dt><dd>Gratis</dd></div>
              <div className="flex justify-between gap-5"><dt>PPN 11%</dt><dd>Termasuk</dd></div>
            </dl>
            <div className="mt-6 flex items-end justify-between border-t border-brand-300 pt-5"><span className="font-serif text-xl font-bold text-brand-900">Total</span><strong className="font-serif text-2xl text-brand-900">{fmt(total)}</strong></div>
            <button type="button" onClick={handleCheckout} disabled={state === 'paying'} className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-brand-900 px-5 py-4 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
              {state === 'paying' ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-50 border-t-transparent" />Memproses pembayaran</> : <>Bayar {fmt(total)} <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></>}
            </button>
            <button type="button" onClick={() => router.push('/checkout/cart')} className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-brand-300 px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-900">Kembali ke keranjang <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 8h-10m4 4-4-4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </aside>
        </div>
      </main>
    </div>
  );
}
