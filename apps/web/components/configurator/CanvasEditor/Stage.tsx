'use client';
import { useEffect, useRef, useCallback } from 'react';
import type { EditorLayer } from './index';
import { useConfiguratorStore } from '../../../lib/stores/configurator';

interface Props {
  layers: EditorLayer[];
  canvasWidth: number;
  canvasHeight: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayersChange: (layers: EditorLayer[]) => void;
  textEditing: string | null;
  onTextEditEnd: () => void;
  fontFamily: string;
  fontSize: number;
  fillColor: string;
}

export default function KonvaStage({
  layers,
  canvasWidth,
  canvasHeight,
  selectedId,
  onSelect,
  onLayersChange,
  onTextEditEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);
  // The coloured editor background is a workspace aid, not cover artwork.
  // Keep it separate so exported PNGs retain alpha for the physical material.
  const backgroundLayerRef = useRef<any>(null);
  const backgroundRectRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const konvaLibRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodesMapRef = useRef<Map<string, any>>(new Map());

  const layersRef = useRef<EditorLayer[]>(layers);
  const selectedIdRef = useRef<string | null>(selectedId);
  const onLayersChangeRef = useRef(onLayersChange);
  const onSelectRef = useRef(onSelect);
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const isMountedRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coverColor = useConfiguratorStore((state) => state.finish.coverColor);

  // Keep refs in sync
  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onLayersChangeRef.current = onLayersChange; }, [onLayersChange]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Export stage snapshot to 3D store (without transformer selection overlay)
  const syncTextureTo3D = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const stage = stageRef.current;
      const tr = transformerRef.current;
      if (!stage || !isMountedRef.current) return;

      try {
        const savedNodes = tr ? tr.nodes() : [];
        const backgroundLayer = backgroundLayerRef.current;
        if (tr) tr.nodes([]);
        if (backgroundLayer) backgroundLayer.visible(false);
        stage.batchDraw();

        const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
        useConfiguratorStore.getState().setCoverTextureUrl(dataUrl);

        if (backgroundLayer) backgroundLayer.visible(true);
        if (tr && savedNodes.length > 0) {
          tr.nodes(savedNodes);
        }
        stage.batchDraw();
      } catch (err) {
        console.warn('Live 3D texture capture error:', err);
      }
    }, 120);
  }, []);

  // Initialize Konva Stage
  useEffect(() => {
    isMountedRef.current = true;
    let stage: any;
    let cleanupFn: (() => void) | null = null;

    void (async () => {
      const KonvaModule = await import('konva');
      if (!isMountedRef.current || !containerRef.current) return;

      const existing = containerRef.current.querySelector('canvas');
      if (existing) existing.remove();

      const K = (KonvaModule as unknown as { default?: typeof KonvaModule }).default ?? KonvaModule;
      const KAny = K as any;
      konvaLibRef.current = KAny;

      const s = new KAny.Stage({
        container: containerRef.current,
        width: canvasWidth,
        height: canvasHeight,
      });
      stage = s;
      stageRef.current = s;
      (window as unknown as Record<string, unknown>).__booxuryStageRef = s;

      // Get active cover color from configurator store
      const storeState = useConfiguratorStore.getState();
      const coverBgColor = storeState.finish?.coverColor || '#1d3557';

      // Background Layer (matches physical hardcover color)
      const bgLayer = new KAny.Layer();
      const bg = new KAny.Rect({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        fill: coverBgColor,
        stroke: '#0f172a',
        strokeWidth: 1,
      });
      bgLayer.add(bg);
      s.add(bgLayer);
      backgroundLayerRef.current = bgLayer;
      backgroundRectRef.current = bg;

      // Content Layer
      const contentLayer = new KAny.Layer();
      s.add(contentLayer);
      contentLayerRef.current = contentLayer;

      // Transformer
      const tr = new KAny.Transformer({
        rotateEnabled: true,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
        boundBoxFunc: (oldBox: { width: number; height: number }, newBox: { width: number; height: number }) => {
          if (newBox.width < 20 || newBox.height < 20) return oldBox;
          return newBox;
        },
      });
      contentLayer.add(tr);
      transformerRef.current = tr;

      // Click background to deselect
      s.on('click tap', (e: { target: unknown }) => {
        if (e.target === bg) {
          onSelectRef.current(null);
          tr.nodes([]);
          contentLayer.batchDraw();
          syncTextureTo3D();
        }
      });

      // Keydown delete handler
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
          const active = document.activeElement;
          if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
          const updated = layersRef.current.filter((l) => l.id !== selectedIdRef.current);
          onLayersChangeRef.current(updated);
          onSelectRef.current(null);
          tr.nodes([]);
          contentLayer.batchDraw();
          syncTextureTo3D();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      cleanupFn = () => {
        window.removeEventListener('keydown', handleKeyDown);
        try {
          s.destroy();
        } catch {
          /* ignore */
        }
      };

      // Initial layer render
      syncLayersToStage();
    })();

    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (cleanupFn) cleanupFn();
      try {
        stage?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [canvasWidth, canvasHeight]);

  // A base colour can be changed after artwork exists. The artwork export is
  // transparent, and this keeps the editor's visual foundation in sync too.
  useEffect(() => {
    const bg = backgroundRectRef.current;
    const layer = backgroundLayerRef.current;
    if (!bg || !layer) return;
    bg.fill(coverColor);
    layer.batchDraw();
  }, [coverColor]);

  // Synchronize layers with Konva nodes whenever layers change
  const syncLayersToStage = useCallback(() => {
    const K = konvaLibRef.current;
    const contentLayer = contentLayerRef.current;
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!K || !contentLayer || !tr || !stage || !isMountedRef.current) return;

    const currentLayerIds = new Set(layers.map((l) => l.id));
    const nodesMap = nodesMapRef.current;

    // 1. Remove deleted nodes
    for (const [id, node] of nodesMap.entries()) {
      if (!currentLayerIds.has(id)) {
        node.destroy();
        nodesMap.delete(id);
      }
    }

    // 2. Add or update nodes
    layers.forEach((layer) => {
      const existingNode = nodesMap.get(layer.id);
      if (existingNode) {
        // Update existing node
        if (layer.type === 'text') {
          existingNode.text(layer.text ?? 'Teks');
          existingNode.fontSize(layer.fontSize ?? 24);
          existingNode.fontFamily(layer.fontFamily ?? 'Playfair Display');
          existingNode.fill(layer.fill ?? '#1a1a2e');
          applyTextEffect(existingNode, layer.finishEffect);
        } else if (layer.type === 'image') {
          if (layer.width) existingNode.width(layer.width);
          if (layer.height) existingNode.height(layer.height);
          applyImageEffect(existingNode, layer.finishEffect);
        }
        existingNode.x(layer.x);
        existingNode.y(layer.y);
        if (layer.rotation !== undefined) existingNode.rotation(layer.rotation);
      } else {
        // Create new node
        if (layer.type === 'image' && layer.src) {
          const cached = imgCache.current[layer.src];
          if (cached) {
            const kImg = createImageNode(K, layer, cached, contentLayer, tr);
            nodesMap.set(layer.id, kImg);
          } else {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              if (!isMountedRef.current || !layer.src) return;
              imgCache.current[layer.src] = img;
              const kImg = createImageNode(K, layer, img, contentLayer, tr);
              nodesMap.set(layer.id, kImg);
              contentLayer.batchDraw();
              syncTextureTo3D();
            };
            img.src = layer.src;
          }
        } else if (layer.type === 'text') {
          const kText = createTextNode(K, layer, contentLayer, tr, stage);
          nodesMap.set(layer.id, kText);
        }
      }
    });

    // Update transformer selection
    if (selectedId) {
      const activeNode = nodesMap.get(selectedId);
      if (activeNode) tr.nodes([activeNode]);
      else tr.nodes([]);
    } else {
      tr.nodes([]);
    }

    contentLayer.batchDraw();
    syncTextureTo3D();
  }, [layers, selectedId, syncTextureTo3D]);

  // Trigger sync on layers change
  useEffect(() => {
    syncLayersToStage();
  }, [layers, syncLayersToStage]);

  // Helper functions to create Konva nodes
  function createImageNode(K: any, layer: EditorLayer, img: HTMLImageElement, contentLayer: any, tr: any) {
    const kImg = new K.Image({
      id: layer.id,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      image: img,
      rotation: layer.rotation ?? 0,
      draggable: true,
    });
    applyImageEffect(kImg, layer.finishEffect);
    attachNodeEvents(kImg, layer, contentLayer, tr);
    contentLayer.add(kImg);
    if (selectedIdRef.current === layer.id) tr.nodes([kImg]);
    return kImg;
  }

  function createTextNode(K: any, layer: EditorLayer, contentLayer: any, tr: any, stage: any) {
    const textNode = new K.Text({
      id: layer.id,
      x: layer.x,
      y: layer.y,
      text: layer.text ?? 'Teks',
      fontSize: layer.fontSize ?? 24,
      fontFamily: layer.fontFamily ?? 'Playfair Display',
      fill: layer.fill ?? '#1a1a2e',
      rotation: layer.rotation ?? 0,
      draggable: true,
    });
    applyTextEffect(textNode, layer.finishEffect);
    attachNodeEvents(textNode, layer, contentLayer, tr, stage);
    contentLayer.add(textNode);
    if (selectedIdRef.current === layer.id) tr.nodes([textNode]);
    return textNode;
  }

  function applyImageEffect(node: any, effect?: string) {
    switch (effect) {
      case 'gold_foil':
        node.shadowColor('#FFD700'); node.shadowBlur(10); node.shadowOffsetX(0); node.shadowOffsetY(0); node.shadowOpacity(0.85); break;
      case 'emboss':
        node.shadowColor('#888'); node.shadowBlur(4); node.shadowOffsetX(2); node.shadowOffsetY(2); node.shadowOpacity(0.5); break;
      case 'deboss':
        node.shadowColor('#333'); node.shadowBlur(3); node.shadowOffsetX(-2); node.shadowOffsetY(-2); node.shadowOpacity(0.6); break;
      case 'spot_uv':
        node.shadowColor('#fff'); node.shadowBlur(6); node.shadowOffsetX(0); node.shadowOffsetY(0); node.shadowOpacity(0.35); break;
      default:
        node.shadowBlur(0); node.shadowOpacity(0);
    }
  }

  function applyTextEffect(node: any, effect?: string) {
    switch (effect) {
      case 'gold_foil':
        node.shadowColor('#FFD700'); node.shadowBlur(12); node.shadowOffsetX(0); node.shadowOffsetY(0); node.shadowOpacity(0.9); break;
      case 'emboss':
        node.shadowColor('#fff'); node.shadowBlur(2); node.shadowOffsetX(1); node.shadowOffsetY(1); node.shadowOpacity(0.7); break;
      case 'deboss':
        node.shadowColor('#333'); node.shadowBlur(3); node.shadowOffsetX(-1); node.shadowOffsetY(-1); node.shadowOpacity(0.6); break;
      case 'spot_uv':
        node.shadowColor('#e0e0ff'); node.shadowBlur(8); node.shadowOffsetX(0); node.shadowOffsetY(0); node.shadowOpacity(0.4); break;
      default:
        node.shadowBlur(0); node.shadowOpacity(0);
    }
  }

  function attachNodeEvents(node: any, layer: EditorLayer, contentLayer: any, tr: any, stage?: any) {
    node.on('click tap', (e: { cancelBubble: boolean }) => {
      e.cancelBubble = true;
      onSelectRef.current(layer.id);
      tr.nodes([node]);
      contentLayer.batchDraw();
    });

    node.on('dragend', () => {
      const updated = layersRef.current.map((l) =>
        l.id === layer.id ? { ...l, x: node.x(), y: node.y() } : l
      );
      onLayersChangeRef.current(updated);
      syncTextureTo3D();
    });

    node.on('transformend', () => {
      const updated = layersRef.current.map((l) =>
        l.id === layer.id
          ? {
              ...l,
              x: node.x(),
              y: node.y(),
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
              rotation: node.rotation(),
            }
          : l
      );
      onLayersChangeRef.current(updated);
      node.scaleX(1);
      node.scaleY(1);
      syncTextureTo3D();
    });

    if (layer.type === 'text' && stage) {
      node.on('dblclick dbltap', () => {
        const textNode = node;
        const textPosition = textNode.absolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        const areaPosition = {
          x: stageBox.left + textPosition.x,
          y: stageBox.top + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = textNode.text();
        textarea.style.position = 'fixed';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${textNode.width() * textNode.scaleX() + 24}px`;
        textarea.style.height = `${(textNode.fontSize() ?? 24) * 2}px`;
        textarea.style.fontSize = `${textNode.fontSize() ?? 24}px`;
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.color = textNode.fill();
        textarea.style.border = '2px solid #c9a96e';
        textarea.style.borderRadius = '6px';
        textarea.style.padding = '4px 6px';
        textarea.style.margin = '0';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'rgba(255,255,255,0.98)';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = '1.2';
        textarea.style.transformOrigin = 'left top';
        textarea.style.transform = `scaleX(${textNode.scaleX()}) scaleY(${textNode.scaleY()})`;
        textarea.style.zIndex = '9999';

        textarea.focus();
        textarea.select();

        const cleanup = () => {
          const newText = textarea.value;
          if (textarea.parentNode) document.body.removeChild(textarea);
          textNode.text(newText);
          const updated = layersRef.current.map((l) =>
            l.id === layer.id ? { ...l, text: newText } : l
          );
          onLayersChangeRef.current(updated);
          onTextEditEnd();
          contentLayer.batchDraw();
          syncTextureTo3D();
        };

        textarea.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            cleanup();
          }
          if (e.key === 'Escape') {
            if (textarea.parentNode) document.body.removeChild(textarea);
            onTextEditEnd();
          }
        });
        textarea.addEventListener('blur', cleanup);
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className="inline-block shadow-lg border border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-[#faf8f5]"
    />
  );
}
