'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-600">
          Terjadi kesalahan
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-[-0.04em] text-brand-900 sm:text-4xl">
          Halaman tidak bisa dimuat.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-600">
          {error?.message
            ? error.message
            : 'Terjadi error tak terduga. Coba muat ulang halaman atau kembali ke beranda.'}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-700"
          >
            Kembali ke beranda
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error?.digest && (
          <p className="mt-6 font-mono text-[10px] text-brand-400">
            digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
