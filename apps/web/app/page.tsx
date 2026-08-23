import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-brand-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <p className="text-brand-700 font-medium tracking-widest uppercase text-sm">Web-to-Print Platform</p>
          <h1 className="text-6xl font-serif font-bold text-brand-900 tracking-tight">Booxury</h1>
          <p className="text-xl text-brand-700 max-w-md mx-auto leading-relaxed">
            Desain hardcover notebook kustom online.<br />
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
            className="px-8 py-4 bg-white text-brand-700 border-2 border-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-lg"
          >
            Admin
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8">
          {[
            { label: '3 Ukuran', sub: 'A5, B5, A6' },
            { label: 'Custom Kover', sub: 'Upload gambar + teks' },
            { label: 'Real-time Preview', sub: 'Lihat harga & spine' },
          ].map(({ label, sub }) => (
            <div key={label} className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-semibold text-brand-900">{label}</p>
              <p className="text-sm text-brand-600 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-brand-500 mt-4">
          Demo: <code className="bg-brand-100 px-2 py-1 rounded">demo@booxury.local</code> / <code className="bg-brand-100 px-2 py-1 rounded">demo123</code>
        </p>
      </div>
    </main>
  );
}
