'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfiguratorStore } from '../../../lib/stores/configurator';
import { useToastStore } from '@/components/ui/Toast';
import { KonvaLayer } from '@booxury/design-types';

import KonvaStage from './Stage';

type Tool = 'select' | 'text' | 'image';

export interface EditorLayer {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  src?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  finishEffect?: 'gold_foil' | 'emboss' | 'deboss' | 'spot_uv' | 'none';
}

const FONT_LIST = ['Playfair Display', 'Lora', 'Open Sans', 'Roboto'];
const FONT_SIZES = [12, 16, 20, 24, 32, 48, 64];
const COLOR_PRESETS = ['#d4af37', '#ffd700', '#ffffff', '#e2e8f0', '#f4a261', '#e63946', '#2d6a4f', '#0f172a'];

// Canvas size in px at 72dpi (screen)
const CANVAS_PX: Record<string, { width: number; height: number; label: string }> = {
  A5: { width: 420, height: 596, label: 'A5 (148 × 210 mm)' },
  B5: { width: 500, height: 708, label: 'B5 (176 × 250 mm)' },
  A6: { width: 298, height: 420, label: 'A6 (105 × 148 mm)' },
};

export default function CanvasEditor() {
  const { base, designPayload, setDesignPayload, updateLayer, designId } = useConfiguratorStore();
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dpiWarning, setDpiWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [textEditing, setTextEditing] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState(FONT_LIST[0]);
  const [fillColor, setFillColor] = useState('#d4af37');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvas = CANVAS_PX[base.size] ?? CANVAS_PX.A5;

  const layers: EditorLayer[] = (designPayload.front as unknown as EditorLayer[]) ?? [];

  // Initialize with elegant gold foil title template if empty
  useEffect(() => {
    if (!designPayload.front || designPayload.front.length === 0) {
      const defaultLayer: EditorLayer = {
        id: 'initial-title',
        type: 'text',
        x: canvas.width / 2 - 90,
        y: canvas.height * 0.36,
        text: 'MY NOTEBOOK',
        fontSize: 26,
        fontFamily: 'Playfair Display',
        fill: '#d4af37',
        finishEffect: 'gold_foil',
      };
      setDesignPayload({ front: [defaultLayer] as unknown as typeof designPayload.front });
    }
  }, [canvas.height, canvas.width, designPayload.front, setDesignPayload]);

  // Check DPI before upload
  const checkDpi = (file: File, targetPx: number): Promise<number> => {
    return new Promise<number>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const dpi = Math.round((img.naturalWidth / targetPx) * 72);
        URL.revokeObjectURL(url);
        resolve(dpi);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
      img.src = url;
    });
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Target canvas width in mm → convert to inches → compare
    const targetMm = base.size === 'A5' ? 148 : base.size === 'B5' ? 176 : 105;
    const targetInch = targetMm / 25.4;
    const dpi = await checkDpi(file, Math.round(targetInch * 72));

    if (dpi < 100) {
      setDpiWarning(`❌ Gambar terlalu rendah resolusinya (${dpi} DPI). Minimum 100 DPI untuk cetak.`);
      return;
    }

    setDpiWarning(dpi < 300 ? `⚠️ Resolusi ${dpi} DPI (di bawah 300 DPI — hasil cetak mungkin kurang tajam)` : null);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json() as { url: string };

      const newLayer: EditorLayer = {
        id: crypto.randomUUID(),
        type: 'image',
        x: 50,
        y: 50,
        width: 120,
        height: 120 * (canvas.height / canvas.width),
        src: url,
        finishEffect: 'none',
      };

      setDesignPayload({ front: [...layers, newLayer] as unknown as typeof designPayload.front });
      setSelectedId(newLayer.id);
    } catch {
      setDpiWarning('❌ Upload gagal. Coba lagi.');
    } finally {
      setUploading(false);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [base.size, canvas, layers, setDesignPayload, designPayload]);

  const addText = () => {
    const newLayer: EditorLayer = {
      id: crypto.randomUUID(),
      type: 'text',
      x: canvas.width / 2 - 60,
      y: canvas.height / 2 - 20,
      text: 'Klik untuk edit',
      fontSize,
      fontFamily,
      fill: fillColor,
      finishEffect: 'none',
    };
    setDesignPayload({ front: [...layers, newLayer] as unknown as typeof designPayload.front });
    setSelectedId(newLayer.id);
    setTextEditing(newLayer.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setDesignPayload({ front: layers.filter(l => l.id !== selectedId) as unknown as typeof designPayload.front });
    setSelectedId(null);
  };

  const applyEffect = (effect: EditorLayer['finishEffect']) => {
    if (!selectedId) return;
    updateLayer('front', selectedId, { finishEffect: effect });
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Get thumbnail from Konva stage
      const stageRef = (window as unknown as Record<string, { toDataURL: (type?: string, quality?: number) => string } | undefined>).__booxuryStageRef;
      const thumbnail = stageRef?.toDataURL('image/png', 0.8);

      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Design ${base.size} ${new Date().toLocaleDateString('id-ID')}`,
          baseConfig: base,
          designPayload,
          thumbnail,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('UNAUTHORIZED');
        throw new Error(`Save failed (${res.status})`);
      }
      const data = await res.json() as { id: string };
      useConfiguratorStore.getState().setDesignId(data.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      const msg = (err as Error).message ?? '';
      if (msg.toLowerCase().includes('unauthorized') || msg.includes('401')) {
        useToastStore.getState().add('Login dulu untuk menyimpan design.', 'error');
      } else {
        useToastStore.getState().add('Gagal menyimpan design. Coba lagi.', 'error');
      }
    } finally {
      setSaving(false);
    }
  }, [base, designPayload]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <ToolBtn active={activeTool === 'select'} onClick={() => setActiveTool('select')} title="Pilih">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          </ToolBtn>
          <ToolBtn active={activeTool === 'text'} onClick={addText} title="Tambah Teks">
            <span className="text-sm font-bold">T</span>
          </ToolBtn>
          <ToolBtn active={false} onClick={() => fileInputRef.current?.click()} title="Upload Gambar">
            <span className="text-sm">🖼</span>
          </ToolBtn>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {uploading && <span className="text-sm text-brand-600 animate-pulse">↗ Mengunggah...</span>}
        {dpiWarning && (
          <span className={`text-xs px-2 py-1 rounded-lg ${dpiWarning.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {dpiWarning}
          </span>
        )}

        {/* Selected layer controls */}
        {selectedLayer && (
          <div className="flex items-center gap-2 ml-2 p-1 bg-brand-50 border border-brand-200 rounded-xl px-3">
            <span className="text-xs text-brand-700 font-medium">{selectedLayer.type === 'text' ? 'Teks' : 'Gambar'}</span>
            {selectedLayer.type === 'text' && (
              <>
                <select value={fontFamily} onChange={e => { setFontFamily(e.target.value); updateLayer('front', selectedId, { fontFamily: e.target.value }); }}
                  className="text-xs border border-brand-300 rounded px-1 py-0.5">
                  {FONT_LIST.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={fontSize} onChange={e => { setFontSize(Number(e.target.value)); updateLayer('front', selectedId, { fontSize: Number(e.target.value) }); }}
                  className="text-xs border border-brand-300 rounded px-1 py-0.5">
                  {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
                <div className="flex gap-1">
                  {COLOR_PRESETS.map(c => (
                    <button key={c} onClick={() => { setFillColor(c); updateLayer('front', selectedId, { fill: c }); }}
                      className="w-4 h-4 rounded border border-gray-300 cursor-pointer" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </>
            )}
            {/* Foil effects */}
            <div className="flex gap-1 ml-1">
              {(['gold_foil', 'emboss', 'deboss', 'spot_uv'] as const).map(fx => (
                <button key={fx} onClick={() => applyEffect(fx)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    selectedLayer.finishEffect === fx ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}>
                  {fx === 'gold_foil' ? 'Gold' : fx === 'emboss' ? 'Emboss' : fx === 'deboss' ? 'Deboss' : 'Spot UV'}
                </button>
              ))}
            </div>
            <button onClick={deleteSelected} className="text-red-500 hover:text-red-700 ml-1" title="Hapus">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saving}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-xl text-sm font-bold hover:bg-brand-900 disabled:opacity-50 transition-colors">
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
          ) : saved ? (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Tersimpan!</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Simpan Design</>
          )}
        </button>
      </div>

      {/* Canvas */}
      <div className="overflow-auto max-h-[600px] bg-gray-100 rounded-xl p-4">
        <KonvaStage
          layers={layers}
          canvasWidth={canvas.width}
          canvasHeight={canvas.height}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onLayersChange={(newLayers) => setDesignPayload({ front: newLayers as unknown as typeof designPayload.front })}
          textEditing={textEditing}
          onTextEditEnd={() => setTextEditing(null)}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fillColor={fillColor}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        {canvas.label} · {canvas.width} × {canvas.height} px · Seret untuk pindahkan · Klik 2× untuk edit teks · Tekan Delete untuk hapus
      </p>
    </div>
  );
}

function ToolBtn({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-brand-700 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
      }`}>
      {children}
    </button>
  );
}
