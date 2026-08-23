'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '../../../lib/stores/configurator';

const COVER_FINISHES = [
  { code: 'doff',       name: 'Laminasi Doff',        desc: 'Matte, halus, kesan premium' },
  { code: 'glossy',     name: 'Laminasi Glossy',      desc: 'Mengkilap, warna lebih hidup' },
  { code: 'canvas',     name: 'Kanvas / Linen',       desc: 'Tekstur kain, tactile premium', price: '+Rp15.000' },
  { code: 'leatherette',name: 'Leatherette (Sintetis)',desc: 'Terlihat seperti kulit',      price: '+Rp25.000' },
];

const CORNER_SHAPES = [
  { code: 'square', name: 'Square (Bulat)', desc: 'Sudut 90° — classic, formal' },
  { code: 'round',  name: 'Round (Tajam)',  desc: 'Sudut membulat — modern, soft feel' },
];

const EDGE_FINISHES = [
  { code: 'plain',          name: 'Plain',           desc: 'Tanpa обработка — natural' },
  { code: 'gilded_gold',    name: 'Gilded (Emas)',    desc: 'Sisi dicat emas metalik',   price: '+Rp20.000' },
  { code: 'gilded_silver',  name: 'Gilded (Perak)',   desc: 'Sisi dicat perak metalik',  price: '+Rp20.000' },
  { code: 'sprayed_red',    name: 'Sprayed (Merah)',  desc: 'Sisi dicat solid merah',    price: '+Rp10.000' },
  { code: 'sprayed_blue',   name: 'Sprayed (Biru)',   desc: 'Sisi dicat solid biru',     price: '+Rp10.000' },
  { code: 'stenciled',      name: 'Stenciled',        desc: 'Motif berulang di sisi',   price: '+Rp8.000' },
];

const HEADBANDS = [
  { code: 'hb_merah',  name: 'Merah',    color: '#b71c1c' },
  { code: 'hb_hitam',  name: 'Hitam',    color: '#1a1a1a' },
  { code: 'hb_emas',   name: 'Emas',     color: '#FFD700' },
  { code: 'hb_putih',  name: 'Putih',    color: '#f5f5f5' },
];

const RIBBONS = [
  { code: 'rb_merah',  name: 'Merah',    color: '#b71c1c' },
  { code: 'rb_emas',   name: 'Emas',     color: '#FFD700' },
  { code: 'rb_hijau',  name: 'Hijau',    color: '#1b5e20' },
  { code: 'rb_biru',   name: 'Biru',     color: '#1565c0' },
  { code: 'rb_hitam',  name: 'Hitam',    color: '#1a1a1a' },
];

function ColorDot({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: hex }}
    />
  );
}

export default function FinishPage() {
  const router = useRouter();
  const { finish, setFinish, setPhase } = useConfiguratorStore();
  usePhaseEffect('finish');

  const goNext = () => { setPhase('review'); router.push('/customize/review'); };
  const goBack = () => { setPhase('cover'); router.push('/customize/cover'); };

  const toggleRibbon = (code: string) => {
    const current = finish.ribbonCodes ?? [];
    if (current.includes(code)) {
      setFinish({ ribbonCodes: current.filter(c => c !== code) });
    } else if (current.length < 2) {
      setFinish({ ribbonCodes: [...current, code] });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif font-bold text-brand-900 mb-1">Material &amp; Finish</h1>
      <p className="text-gray-500 mb-8">Step 3 dari 4 — Semua yang terlihat &amp; terasa di buku kamu.</p>

      <div className="space-y-8">

        {/* ── Row 1: Cover Finish + Corner Shape ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Cover Finish */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Pelapis Kover</h2>
            <div className="grid grid-cols-1 gap-2">
              {COVER_FINISHES.map((f) => (
                <button
                  key={f.code}
                  onClick={() => setFinish({ coverFinish: f.code as typeof finish.coverFinish })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    finish.coverFinish === f.code
                      ? 'border-brand-700 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="font-medium text-sm">{f.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}{f.price ? ` · ${f.price}` : ''}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Corner Shape */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Bentuk Sudut</h2>
            <div className="grid grid-cols-1 gap-2">
              {CORNER_SHAPES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setFinish({ cornerShape: c.code as typeof finish.cornerShape })}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    finish.cornerShape === c.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {/* Visual icon */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {c.code === 'square' ? (
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-brand-700">
                        <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" rx="1"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-brand-700">
                        <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" rx="6"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── Row 2: Edge Finish + Dust Jacket ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Edge Finish */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Samping / Edge Finish</h2>
            <p className="text-xs text-gray-400 mb-3"> обработка pinggir halaman (top · fore-edge · bottom)</p>
            <div className="grid grid-cols-2 gap-2">
              {EDGE_FINISHES.map((e) => (
                <button
                  key={e.code}
                  onClick={() => setFinish({ edgeFinish: e.code as typeof finish.edgeFinish })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    finish.edgeFinish === e.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <p className="font-medium text-xs">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.desc}</p>
                  {e.price && <p className="text-xs text-brand-700 mt-1">{e.price}</p>}
                </button>
              ))}
            </div>
          </section>

          {/* Dust Jacket */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-4">Dust Jacket</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sampul kertas luar yang bisa dilepas — melindungi kover hardcover dari goresan &amp; debu.
            </p>
            <div className="flex items-center justify-between p-4 border rounded-xl">
              <div>
                <p className="font-medium text-sm">Dust Jacket (+Rp8.000)</p>
                <p className="text-xs text-gray-500 mt-0.5">Akan dicetak desain cover yang sama</p>
              </div>
              <button
                onClick={() => setFinish({ hasDustJacket: !finish.hasDustJacket })}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                  finish.hasDustJacket ? 'bg-brand-700' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    finish.hasDustJacket ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        {/* ── Row 3: Headband + Ribbon Markers ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Headband & Tailband */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-1">Headband &amp; Tailband</h2>
            <p className="text-xs text-gray-400 mb-4">Pita tenun di ujung punggung atas &amp; bawah (+Rp2.000/warna)</p>
            <div className="flex flex-wrap gap-2">
              {HEADBANDS.map((h) => (
                <button
                  key={h.code}
                  onClick={() => setFinish({
                    headbandCode: finish.headbandCode === h.code ? undefined : h.code,
                  })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                    finish.headbandCode === h.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <ColorDot hex={h.color} />
                  <span className="font-medium text-xs">{h.name}</span>
                  {finish.headbandCode === h.code && (
                    <svg className="w-3.5 h-3.5 text-brand-700 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Ribbon Markers */}
          <section className="bg-white rounded-2xl shadow border p-6">
            <h2 className="font-semibold text-brand-900 mb-1">Pita Pembatas (Ribbon Marker)</h2>
            <p className="text-xs text-gray-400 mb-4">Max 2 pita — menjuntai dari bawah (+Rp3.000/pita)</p>
            <div className="flex flex-wrap gap-2">
              {RIBBONS.map((r) => {
                const isSelected = (finish.ribbonCodes ?? []).includes(r.code);
                const isDisabled = !isSelected && (finish.ribbonCodes ?? []).length >= 2;
                return (
                  <button
                    key={r.code}
                    onClick={() => toggleRibbon(r.code)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                      isSelected
                        ? 'border-brand-700 bg-brand-50'
                        : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <ColorDot hex={r.color} />
                    <span className="font-medium text-xs">{r.name}</span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-brand-700 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {(finish.ribbonCodes ?? []).length > 0 && (
              <p className="text-xs text-brand-700 mt-2">
                ✓ {finish.ribbonCodes!.length}/2 pita dipilih
              </p>
            )}
          </section>
        </div>

        {/* ── Summary Bar ─────────────────────────────────────────────── */}
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Kover:</span>
            <span className="font-medium text-brand-900">
              {COVER_FINISHES.find(f => f.code === finish.coverFinish)?.name}
            </span>
          </div>
          <div className="w-px bg-brand-300 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Sudut:</span>
            <span className="font-medium text-brand-900">
              {CORNER_SHAPES.find(c => c.code === finish.cornerShape)?.name}
            </span>
          </div>
          <div className="w-px bg-brand-300 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Edge:</span>
            <span className="font-medium text-brand-900">
              {EDGE_FINISHES.find(e => e.code === finish.edgeFinish)?.name}
            </span>
          </div>
          <div className="w-px bg-brand-300 hidden md:block" />
          {finish.hasDustJacket && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Dust Jacket:</span>
                <span className="font-medium text-brand-900">Ya</span>
              </div>
              <div className="w-px bg-brand-300 hidden md:block" />
            </>
          )}
          {finish.headbandCode && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Headband:</span>
                <span className="font-medium text-brand-900">
                  {HEADBANDS.find(h => h.code === finish.headbandCode)?.name}
                </span>
              </div>
              <div className="w-px bg-brand-300 hidden md:block" />
            </>
          )}
          {(finish.ribbonCodes ?? []).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Pita:</span>
              <span className="font-medium text-brand-900">
                {finish.ribbonCodes!.map(c => RIBBONS.find(r => r.code === c)?.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="flex gap-4">
          <button onClick={goBack} className="flex-1 py-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
            ← Kembali
          </button>
          <button onClick={goNext} className="flex-1 py-4 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900 transition-colors">
            Review &amp; Checkout →
          </button>
        </div>

      </div>
    </div>
  );
}

function usePhaseEffect(phase: 'finish') {
  useEffect(() => { useConfiguratorStore.getState().setPhase(phase); }, [phase]);
}
