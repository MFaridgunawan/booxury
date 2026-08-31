'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#faf9f7' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8c2f33' }}>
              Error kritis
            </p>
            <h1 style={{ marginTop: '0.75rem', fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#171717' }}>
              Aplikasi mengalami crash.
            </h1>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#525252', maxWidth: '28rem' }}>
              {error?.message || 'Terjadi error tak terduga. Coba reload halaman.'}
            </p>
            <button
              onClick={reset}
              style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', background: '#171717', color: '#fafaf9', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Muat ulang
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
