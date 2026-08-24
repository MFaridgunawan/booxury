import Link from 'next/link';
import LandingCanvasWrapper from '@/components/three/landing-canvas-wrapper';
import { StaticFallback } from '@/components/three/landing-canvas';

export const metadata = {
  title: 'Booxury — Custom Hardcover Notebook',
  description:
    'Desain hardcover notebook kustom online. Pilih ukuran, kertas, dan buat kover sesuai selera. Cetak dengan kualitas premium.',
  openGraph: {
    title: 'Booxury — Custom Hardcover Notebook',
    description: 'Desain hardcover notebook kustom online. Pilih ukuran, kertas, dan buat kover sesuai selera.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* ── Hero: SSR content (SEO + LCP) + deferred 3D canvas ── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* 3D canvas — deferred mount, SSR fallback visible to crawlers */}
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <StaticFallback />
          <div className="absolute inset-0">
            <LandingCanvasWrapper />
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-2xl w-full text-center px-6 space-y-8">
          <div className="space-y-4">
            <p className="text-brand-700 font-medium tracking-widest uppercase text-sm animate-fade-in">
              Web-to-Print Platform
            </p>
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-brand-900 tracking-tight leading-none">
              Booxury
            </h1>
            <p className="text-xl text-brand-700 max-w-md mx-auto leading-relaxed">
              Desain hardcover notebook kustom online.
              <br />
              Pilih ukuran, kertas, dan buat kover sesuai selera.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/customize/base"
              className="px-8 py-4 bg-brand-700 text-white font-semibold rounded-xl shadow-lg hover:bg-brand-900 transition-colors text-lg"
            >
              Mulai Desain
            </Link>
            <Link
              href="/admin"
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-brand-700 border-2 border-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-lg"
            >
              Admin
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── Features section ── */}
      <section className="relative z-10 bg-white/80 backdrop-blur-md py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-4">
              Kenapa Booxury?
            </h2>
            <p className="text-brand-700 max-w-lg mx-auto">
              Setiap buku dibuat sesuai pesanan dengan kualitas cetak premium
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                ),
                title: '3 Ukuran Standar',
                desc: 'A5, B5, A6 — ukurannya presisi sesuai standar industri buku',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                ),
                title: 'Custom Cover',
                desc: 'Upload gambar, tambah teks, gold foil, emboss — lihat preview langsung',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                ),
                title: 'Real-time Preview',
                desc: 'Lihat estimasi harga dan spine width real-time saat desain',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-brand-50 rounded-2xl p-6 text-center hover:bg-brand-100 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-700 text-white rounded-xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-brand-900 mb-2">{f.title}</h3>
                <p className="text-sm text-brand-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-serif font-bold text-brand-900">
            Buat buku hardcover-mu sekarang
          </h2>
          <p className="text-brand-700">
            Mulai dari Rp25.000 — desain dalam 5 menit, hasil cetak premium.
          </p>
          <Link
            href="/customize/base"
            className="inline-block px-10 py-4 bg-brand-700 text-white font-bold rounded-xl shadow-lg hover:bg-brand-900 transition-colors text-lg"
          >
            Mulai Desain Sekarang
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-6 px-6 border-t border-brand-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-500">
          <p>Booxury — Custom Hardcover Notebook</p>
          <p>Demo: <code className="bg-brand-100 px-2 py-0.5 rounded">demo@booxury.local</code> / <code className="bg-brand-100 px-2 py-0.5 rounded">demo123</code></p>
        </div>
      </footer>
    </main>
  );
}
