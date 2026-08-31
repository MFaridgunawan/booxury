'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '@/lib/stores/configurator';
import { useToastStore } from '@/components/ui/Toast';
import { COVER_FINISHES } from '@/lib/cover-foundation';

const ENDSHEETS = [
  { code: 'ENDPLAIN', name: 'Krem Novel (Ivory)',    desc: 'Standar novel — hangat & klasik',      color: '#eee5cf', highlight: true },
  { code: 'ENDFLAT',  name: 'Putih Bersih (HVS)',    desc: 'Minimalis & modern',                   color: '#ffffff' },
  { code: 'ENDKRAFT', name: 'Kraft Coklat',          desc: 'Artisan brown — serat klasik natural', color: '#b88d57' },
  { code: 'ENDHITAM', name: 'Hitam Elegan',          desc: 'Eksklusif — cocok untuk kover gelap',  color: '#1a1a1a' },
  { code: 'ENDABU',   name: 'Abu-Abu Doff',          desc: 'Kesan kontemporer & profesional',      color: '#555b6e' },
  { code: 'ENDPAT',   name: 'Motif Marmer Klasik',   desc: 'Sentuhan artistik buku hardcover kuno',color: '#dacdaf', price: '+Rp5.000' },
];

const CORNER_SHAPES = [
  { code: 'square', name: 'Square (Siku)', desc: 'Sudut 90° presisi — classic, formal' },
  { code: 'round',  name: 'Round (Membulat)', desc: 'Sudut membulat — modern, soft feel' },
];

const EDGE_FINISHES = [
  { code: 'plain',          name: 'Plain',            desc: 'Natural edge (sesuai kertas)',              price: null },
  { code: 'gilded_gold',    name: 'Gilded (Emas)',    desc: 'Sisi dicat emas metalik',                   price: '+Rp20.000' },
  { code: 'gilded_silver',  name: 'Gilded (Perak)',   desc: 'Sisi dicat perak metalik',                  price: '+Rp20.000' },
  { code: 'sprayed_red',    name: 'Sprayed (Merah)',   desc: 'Sisi dicat solid merah',                    price: '+Rp10.000' },
  { code: 'sprayed_blue',   name: 'Sprayed (Biru)',    desc: 'Sisi dicat solid biru',                    price: '+Rp10.000' },
  { code: 'stenciled',      name: 'Stenciled',         desc: 'Motif berulang di sisi',                    price: '+Rp8.000' },
];

const HEADBANDS = [
  { code: 'hb_merah', name: 'Merah',   color: '#b71c1c' },
  { code: 'hb_hitam', name: 'Hitam',   color: '#1a1a1a' },
  { code: 'hb_emas',  name: 'Emas',    color: '#FFD700' },
  { code: 'hb_putih', name: 'Putih',   color: '#f5f5f5' },
];

const RIBBONS = [
  { code: 'rb_merah', name: 'Merah',  color: '#b71c1c' },
  { code: 'rb_emas',  name: 'Emas',   color: '#FFD700' },
  { code: 'rb_hijau', name: 'Hijau',  color: '#1b5e20' },
  { code: 'rb_biru',  name: 'Biru',   color: '#1565c0' },
  { code: 'rb_hitam', name: 'Hitam',  color: '#1a1a1a' },
];

function ColorDot({ hex }: { hex: string }) {
  return <span className="inline-block w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 shadow-inner" style={{ backgroundColor: hex }} />;
}

export default function FinishPage() {
  const router = useRouter();
  const { finish, setFinish, setPhase, base, setBase, designId, designPayload } = useConfiguratorStore();
  useEffect(() => { setPhase('finish'); }, []);

  const [price, setPrice] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Array<{ item: string; amount: number }>>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Real-time price on every finish/base change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch('/api/price-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sizeCode: base.size,
            pages: base.pages,
            paperCode: base.paperCode,
            boardCode: base.boardCode,
            endpaperCode: base.endpaperCode,
            layout: base.layout,
            coverFinish: finish.coverFinish,
            cornerShape: finish.cornerShape,
            edgeFinish: finish.edgeFinish,
            hasDustJacket: finish.hasDustJacket,
            headbandCode: finish.headbandCode,
            ribbonCodes: finish.ribbonCodes ?? [],
            accessories: [
              ...(finish.hasDustJacket ? [{ code: 'dust_jacket', type: 'STRAP' }] : []),
              ...(finish.headbandCode ? [{ code: finish.headbandCode, type: 'RIBBON' }] : []),
              ...((finish.ribbonCodes ?? []).map(c => ({ code: c, type: 'RIBBON' as const }))),
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json() as { total: number; breakdown: Array<{ item: string; amount: number }> };
          setPrice(data.total);
          setBreakdown(data.breakdown ?? []);
        }
      } catch { /* ignore */ }
      finally { setPriceLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [
    base.size, base.pages, base.paperCode, base.boardCode, base.endpaperCode, base.layout,
    finish.coverFinish, finish.cornerShape, finish.edgeFinish, finish.hasDustJacket,
    finish.headbandCode, JSON.stringify(finish.ribbonCodes),
  ]);

  const saveFinish = async () => {
    if (!designId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/designs/${designId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finishConfig: finish,
          finishZones: (designPayload.finishZones as unknown as Array<unknown>) ?? [],
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      useToastStore.getState().add('Konfigurasi tersimpan!', 'success');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save finish error:', err);
      useToastStore.getState().add('Gagal menyimpan. Coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (designId) await saveFinish();
    setPhase('review');
    router.push('/customize/review');
  };
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
    <div className="space-y-8">

      {/* ── 1. Endsheet (Kertas Pembatas Dalam) ─────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg text-brand-900">Endsheet (Kertas Pembatas Dalam)</h2>
          <span className="text-xs bg-amber-100 text-amber-900 font-medium px-2 py-0.5 rounded-full">Buka Isi</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Lembar pembatas (endsheet) yang merekatkan kover hardcover ke isi buku. Terlihat saat buku dibuka (Klik tombol <em>2. Buka Isi</em> di 3D).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ENDSHEETS.map((e) => {
            const isSelected = base.endpaperCode === e.code;
            return (
              <button
                key={e.code}
                onClick={() => setBase({ endpaperCode: e.code })}
                className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                  isSelected ? 'border-brand-700 bg-brand-50 shadow-sm ring-1 ring-brand-700' : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/20 shadow-sm flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: e.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                    {e.name}
                    {e.highlight && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.2 rounded-full font-bold">Favorit</span>}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{e.desc}{e.price ? ` · ${e.price}` : ''}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Bentuk Sudut & Dust Jacket ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Bentuk Sudut</h2>
          <div className="grid grid-cols-1 gap-2">
            {CORNER_SHAPES.map((c) => (
              <button key={c.code}
                onClick={() => setFinish({ cornerShape: c.code as typeof finish.cornerShape })}
                className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                  finish.cornerShape === c.code ? 'border-brand-700 bg-brand-50 shadow-sm' : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 40 40" className="w-8 h-8 text-brand-700">
                    <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5"
                      rx={c.code === 'round' ? '6' : '1'} />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Dust Jacket</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sampul kertas luar yang bisa dilepas — melindungi kover hardcover dari goresan &amp; debu.
          </p>
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div>
              <p className="font-medium text-sm">Dust Jacket (+Rp8.000)</p>
              <p className="text-xs text-gray-500 mt-0.5">Dicetak dengan desain cover yang sama</p>
            </div>
            <button
              onClick={() => setFinish({ hasDustJacket: !finish.hasDustJacket })}
              className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                finish.hasDustJacket ? 'bg-brand-700' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${finish.hasDustJacket ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      </div>

      {/* ── 4. Samping / Edge Finish ─────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-brand-900 mb-1">Samping / Edge Finish</h2>
        <p className="text-xs text-gray-400 mb-4">Finishing pada tepi kertas buku (Plain = sesuai warna kertas)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {EDGE_FINISHES.map((e) => (
            <button key={e.code}
              onClick={() => setFinish({ edgeFinish: e.code as typeof finish.edgeFinish })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                finish.edgeFinish === e.code ? 'border-brand-700 bg-brand-50 shadow-sm' : 'border-gray-200 hover:border-brand-300'
              }`}
            >
              <p className="font-medium text-xs">{e.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{e.desc}</p>
              {e.price && <p className="text-xs text-brand-700 font-semibold mt-1">{e.price}</p>}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-1">Headband &amp; Tailband</h2>
          <p className="text-xs text-gray-400 mb-4">Pita tenun di ujung punggung atas &amp; bawah (+Rp2.000/warna)</p>
          <div className="flex flex-wrap gap-2">
            {HEADBANDS.map((h) => (
              <button key={h.code}
                onClick={() => setFinish({ headbandCode: finish.headbandCode === h.code ? undefined : h.code })}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                  finish.headbandCode === h.code ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                }`}
              >
                <ColorDot hex={h.color} />
                <span className="font-medium text-xs">{h.name}</span>
                {finish.headbandCode === h.code && (
                  <svg className="w-3.5 h-3.5 text-brand-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border p-6">
          <h2 className="font-semibold text-brand-900 mb-1">Pita Pembatas (Ribbon Marker)</h2>
          <p className="text-xs text-gray-400 mb-4">Max 2 pita — menjuntai dari bawah (+Rp3.000/pita)</p>
          <div className="flex flex-wrap gap-2">
            {RIBBONS.map((r) => {
              const isSelected = (finish.ribbonCodes ?? []).includes(r.code);
              const isDisabled = !isSelected && (finish.ribbonCodes ?? []).length >= 2;
              return (
                <button key={r.code} onClick={() => toggleRibbon(r.code)} disabled={isDisabled}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                    isSelected ? 'border-brand-700 bg-brand-50'
                    : isDisabled ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                    : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <ColorDot hex={r.color} />
                  <span className="font-medium text-xs">{r.name}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-brand-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {(finish.ribbonCodes ?? []).length > 0 && (
            <p className="text-xs text-brand-700 mt-2">✓ {(finish.ribbonCodes ?? []).length}/2 pita dipilih</p>
          )}
        </section>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Kover:</span>
          <span className="font-medium text-brand-900">{COVER_FINISHES.find(f => f.code === finish.coverFinish)?.name}</span>
        </div>
        <div className="w-px bg-brand-300 hidden md:block" />
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Sudut:</span>
          <span className="font-medium text-brand-900">{CORNER_SHAPES.find(c => c.code === finish.cornerShape)?.name}</span>
        </div>
        <div className="w-px bg-brand-300 hidden md:block" />
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Edge:</span>
          <span className="font-medium text-brand-900">{EDGE_FINISHES.find(e => e.code === finish.edgeFinish)?.name}</span>
        </div>
        {finish.hasDustJacket && <>
          <div className="w-px bg-brand-300 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Dust Jacket:</span>
            <span className="font-medium text-brand-900">Ya</span>
          </div>
        </>}
        {finish.headbandCode && <>
          <div className="w-px bg-brand-300 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Headband:</span>
            <span className="font-medium text-brand-900">{HEADBANDS.find(h => h.code === finish.headbandCode)?.name}</span>
          </div>
        </>}
        {(finish.ribbonCodes ?? []).length > 0 && <>
          <div className="w-px bg-brand-300 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Pita:</span>
            <span className="font-medium text-brand-900">{(finish.ribbonCodes ?? []).map(c => RIBBONS.find(r => r.code === c)?.name).join(', ')}</span>
          </div>
        </>}
      </div>

      <div className="bg-gradient-to-r from-brand-700 to-brand-900 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-brand-200 uppercase tracking-wide">Estimasi Harga</p>
            <p className="text-3xl font-bold mt-1">
              {priceLoading ? (
                <span className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin align-middle" />
              ) : price !== null ? (
                `Rp ${new Intl.NumberFormat('id-ID').format(price)}`
              ) : '—'}
            </p>
            {breakdown.length > 0 && (
              <details className="mt-2 text-xs text-brand-200">
                <summary className="cursor-pointer hover:text-white">{breakdown.length} komponen</summary>
                <ul className="mt-2 space-y-0.5">
                  {breakdown.map((b, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>{b.item}</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(b.amount)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {designId && (
              <button onClick={saveFinish} disabled={saving}
                className="text-xs px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur disabled:opacity-50">
                {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan Finish'}
              </button>
            )}
            <p className="text-xs text-brand-200">{designId ? `Design #${designId.slice(0, 8)}` : 'Design belum disimpan'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={goBack}
          className="flex-1 py-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
          ← Kembali
        </button>
        <button onClick={goNext} disabled={saving}
          className="flex-1 py-4 bg-brand-700 text-white rounded-xl font-bold hover:bg-brand-900 transition-colors disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Review & Checkout →'}
        </button>
      </div>

    </div>
  );
}
