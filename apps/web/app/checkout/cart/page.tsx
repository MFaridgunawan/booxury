'use client';

import Link from 'next/link';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { useConfiguratorStore, type CartItem } from '../../../lib/stores/configurator';

const fmt = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const COVER_LABELS: Record<string, string> = {
  doff: 'Laminasi doff', glossy: 'Laminasi glossy', canvas: 'Kanvas / linen', leatherette: 'Leatherette',
};

const PAPER_LABELS: Record<string, string> = {
  BOOK57: 'Bookpaper 57 gsm', BOOK72: 'Bookpaper 72 gsm', BOOK90: 'Bookpaper 90 gsm',
  HVS70: 'HVS 70 gsm', HVS80: 'HVS 80 gsm', HVS100: 'HVS 100 gsm',
  ART120: 'Art Paper 120 gsm', ART150: 'Art Paper 150 gsm', MATT120: 'Matt Paper 120 gsm', MATT150: 'Matt Paper 150 gsm',
};

function BookThumbnail() {
  return (
    <div aria-hidden="true" className="relative h-28 w-20 shrink-0 overflow-hidden border border-brand-300 bg-brand-100">
      <div className="absolute bottom-3 left-3 h-[4.4rem] w-11 -rotate-[8deg] border border-brand-300 bg-brand-50 shadow-[5px_7px_9px_rgba(17,17,17,0.14)]">
        <span className="absolute right-2 top-3 h-px w-4 bg-accent-500" />
        <span className="absolute left-2 right-2 top-8 border-y border-brand-900 py-1 text-center font-serif text-[7px] text-brand-900">BOOXURY</span>
        <span className="absolute bottom-0 right-2 h-7 w-1 bg-[#7c252b]" />
      </div>
      <span className="absolute bottom-3 right-2 h-12 w-2 -rotate-[8deg] bg-brand-200" />
    </div>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const { removeFromCart } = useConfiguratorStore();
  const finishing = item.edgeFinish === 'plain' ? 'Sisi standar' : item.edgeFinish.replaceAll('_', ' ');

  return (
    <article className="grid gap-4 border-b border-brand-300 py-6 sm:grid-cols-[5rem_1fr_auto] sm:gap-6">
      <BookThumbnail />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4 sm:hidden">
          <div>
            <h2 className="font-serif text-xl font-bold tracking-[-0.02em] text-brand-900">{item.size} Hardcover</h2>
            <p className="mt-1 text-xs text-brand-600">{item.pages} halaman · {PAPER_LABELS[item.paperCode] ?? item.paperCode}</p>
          </div>
          <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Hapus ${item.size} Hardcover`} className="p-1 text-brand-500 transition-colors hover:text-[#7c252b]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <h2 className="hidden font-serif text-xl font-bold tracking-[-0.02em] text-brand-900 sm:block">{item.size} Hardcover</h2>
        <p className="mt-1 text-xs text-brand-600">{item.pages} halaman · {PAPER_LABELS[item.paperCode] ?? item.paperCode}</p>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-brand-700">
          <span className="border border-brand-300 px-2 py-1">{COVER_LABELS[item.coverFinish] ?? item.coverFinish}</span>
          <span className="border border-brand-300 px-2 py-1">Sudut {item.cornerShape}</span>
          <span className="border border-brand-300 px-2 py-1">{finishing}</span>
          {item.hasDustJacket && <span className="border border-brand-300 px-2 py-1">Dust jacket</span>}
          {item.headbandCode && <span className="border border-brand-300 px-2 py-1">Headband {item.headbandCode.replace('hb_', '')}</span>}
          {(item.ribbonCodes ?? []).length > 0 && <span className="border border-brand-300 px-2 py-1">Pita {(item.ribbonCodes ?? []).map((code) => code.replace('rb_', '')).join(', ')}</span>}
        </div>
        <p className="mt-3 text-[11px] text-brand-500">Spine {item.spineWidthMm} mm</p>
      </div>
      <div className="hidden min-w-28 text-right sm:block">
        <button type="button" onClick={() => removeFromCart(item.id)} className="ml-auto block p-1 text-brand-500 transition-colors hover:text-[#7c252b]" title="Hapus item">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <p className="mt-5 font-serif text-xl font-bold text-brand-900">{fmt(item.price)}</p>
      </div>
      <p className="font-serif text-xl font-bold text-brand-900 sm:hidden">{fmt(item.price)}</p>
    </article>
  );
}

export default function CartPage() {
  const { cart } = useConfiguratorStore();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-brand-50">
      <CheckoutHeader current="cart" />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Pilihan Anda</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.045em] text-brand-900 sm:text-5xl">Keranjang desain.</h1>
            <p className="mt-3 text-sm text-brand-600">{cart.length} {cart.length === 1 ? 'desain siap' : 'desain siap'} untuk direview.</p>

            {cart.length === 0 ? (
              <div className="mt-12 border-y border-brand-300 py-14 text-center">
                <svg className="mx-auto h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M3.75 4.5h1.5l1.2 10.2a2.25 2.25 0 0 0 2.23 1.99h7.94a2.25 2.25 0 0 0 2.18-1.7L20.25 9H6.75m2.25 11.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm9 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                <p className="mt-4 font-serif text-2xl font-bold text-brand-900">Belum ada buku di sini.</p>
                <Link href="/customize/base" className="mt-6 inline-flex items-center gap-2 border border-brand-900 px-5 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-900 hover:text-brand-50">Mulai desain <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              </div>
            ) : (
              <div className="mt-8 border-t border-brand-300">
                {cart.map((item) => <CartItemRow key={item.id} item={item} />)}
                <Link href="/customize/base" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-accent-600">Tambah desain lain <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <aside className="h-fit border-y border-brand-900 py-6 lg:sticky lg:top-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">Ringkasan</p>
              <dl className="mt-6 space-y-4 text-sm text-brand-600">
                <div className="flex justify-between gap-5"><dt>Subtotal · {cart.length} desain</dt><dd>{fmt(total)}</dd></div>
                <div className="flex justify-between gap-5"><dt>Pengiriman</dt><dd className="text-right">Dihitung saat checkout</dd></div>
              </dl>
              <div className="mt-6 flex items-end justify-between border-t border-brand-300 pt-5"><span className="font-serif text-xl font-bold text-brand-900">Estimasi total</span><strong className="font-serif text-2xl text-brand-900">{fmt(total)}</strong></div>
              <Link href="/checkout" className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-brand-900 px-5 py-4 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700">Lanjut ke checkout <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              <p className="mt-4 text-[11px] leading-relaxed text-brand-500">Estimasi produksi 3–5 hari kerja setelah spesifikasi final dikonfirmasi.</p>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
