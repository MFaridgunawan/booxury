# Hari 5 — Motion 3D Landing Page + Cinematic Wizard Experience

**Tanggal**: Jumat, 28 Agustus 2026
**Agent**: Opus 4.6 (plan + review) + Sonnet 4.6 (execution via Claude Code)
**Status**: ✅ Build-clean, dev-ready
**Detail roadmap**: [`../planning/roadmap-sprint1.md`](../planning/roadmap-sprint1.md#hari-5--fase-4-review--pre-flight--cart)
**Pivot**: Original plan (CSS 3D + SVG textures + Phase 4 + Cart) → Full R3F 3D landing + cinematic wizard

---

## PIVOT RATIONALE

User memilih upgrade besar di tengah sprint:
- Landing page: CSS 3D → **React Three Fiber** (proper 3D, PBR materials, postprocessing)
- Cinematic transitions: CSS stepper → **GSAP + camera rigs** (game RPG-style)
- Asset: Procedural geometry + Polyhaven CC0 template modify
- Trade-off: lebih kompleks tapi result jauh lebih premium

Pertimbangan:
- SSR-safe tetap dijaga (dynamic + ssr:false)
- SEO tetap prioritas (landing page = Server Component)
- Performance: frameloop="demand" untuk wizard, "always" hanya untuk landing hero
- Prefers-reduced-motion → static SVG fallback

---

## IMPLEMENTATION LOG

### Packages Created

#### `packages/three/` — R3F workspace package ✅
```
packages/three/
├── package.json              # pinned: three@0.185.1, fiber@9.7.0, drei@10.7.8,
│                            # postprocessing@3.1.0, gsap@3.15.0, motion@13.1.1
├── tsconfig.json            # moduleResolution: Bundler, jsx: react-jsx
└── src/
    ├── index.ts              # barrel export: Scene3D, HardcoverModel, camera rigs
    ├── client-only.tsx       # SSR-safe wrapper (next/dynamic pattern)
    ├── book-materials.tsx    # PBR material factory (COVER_PARAMS, EDGE_COLORS,
    │                          # RIBBON_COLORS, CORNER_RADIUS, SIZE_DIMS)
    ├── hardcover-model.tsx    # Procedural book: RoundedBox spine+cover+pages+
    │                          # endpaper+headband+ribbon flutter+dust jacket
    ├── camera-rigs.tsx       # CinematicRig (GSAP tweened camera) + OrbitRig
    └── scene-3d.tsx          # Full scene: Canvas+Stage+PerformanceMonitor+
                               # AdaptiveDpr+Bloom+Vignette
```

#### `apps/web/components/three/` ✅
```
apps/web/components/three/
├── landing-canvas.tsx           # R3F Canvas wrapper (Scene3D with autoRotate)
├── landing-canvas-wrapper.tsx   # SSR-safe: requestIdleCallback + reduced-motion
│                                 # + GSAP scroll parallax (hero section)
└── wizard-canvas.tsx            # Zustand-connected Canvas, reads base+finish,
                                  # lazy-loaded via dynamic({ ssr: false })
```

#### `apps/web/components/ui/` ✅
```
apps/web/components/ui/
├── gsap-hooks.ts        # useGSAP (gsap.context + auto cleanup) + useScrollTrigger
└── motion-presets.ts    # Framer Motion variants: fadeUp, staggerContainer,
                          # scaleIn, slideInLeft, buttonTap
```

### Files Modified

| File | Change |
|---|---|
| `apps/web/app/page.tsx` | Rewrite as SSR Server Component + deferred 3D canvas |
| `apps/web/package.json` | Added `@booxury/three: workspace:*`, `gsap: ^3.15.0`, `motion: ^13.1.1` |
| `apps/web/tsconfig.json` | `moduleResolution: "bundler"`, added `@/*` paths, exclude `packages/three/src` |
| `apps/web/app/customize/layout.tsx` | Fixed import depth (`../../components/`) |
| `apps/web/app/customize/*/page.tsx` | Fixed import depth (`../../../lib/`) |
| `apps/web/components/ui/gsap-hooks.ts` | Fixed duplicate `gsap` import |
| `apps/web/app/customize/cover/page.tsx` | Fixed `base.paper` → `base.paperCode`, `base.board` → `base.boardCode` |
| `packages/three/src/scene-3d.tsx` | Fixed GSAP import order |
| `packages/three/src/index.ts` | Removed broken `./ribbon-marker` export, added type exports |

### TypeScript Errors Fixed (8 total)

| Error | Fix |
|---|---|
| `Cannot find module './ribbon-marker'` | Removed export from barrel (RibbonFlutter inline in hardcover-model.tsx) |
| `Cannot find module 'next/dynamic'` | Removed ClientOnly from barrel (web app uses own dynamic pattern) |
| `Duplicate identifier 'gsap'` | Removed type-only re-import, kept value import |
| `Property 'paper' does not exist` | Changed to `paperCode` |
| `Property 'board' does not exist` | Changed to `boardCode` |
| `GSAP import after usage` | Moved `import gsap` before `gsap.registerPlugin()` |
| `moduleResolution: "node"` can't resolve `exports` | Changed to `moduleResolution: "bundler"` |
| `packages/three/src compiled by web app tsconfig` | Added exclude glob, confirmed webpack build clean |

---

## CURRENT STATE

### Build Status
```
@booxury/web#build  ✅ Compiled successfully (4.5s)
@booxury/api#build  ❌ TypeScript config issue (pre-existing, separate)
```

### What Works
- [x] `pnpm --filter @booxury/web build` → clean
- [x] Landing page: SSR HTML (SEO-safe) + deferred R3F canvas
- [x] 3D book: procedural geometry (spine, cover, pages, headband, ribbon flutter, dust jacket)
- [x] PBR materials: cover finish (doff/glossy/canvas/leatherette), corner shape (square/round)
- [x] Camera rigs: OrbitRig (interactive) + CinematicRig (GSAP tweened)
- [x] Postprocessing: Bloom + Vignette
- [x] Wizard 3D preview: Zustand-connected, lazy-loaded
- [x] GSAP hooks: useGSAP + useScrollTrigger with auto-cleanup
- [x] Reduced-motion fallback: SVG book illustration

### What Remains (Phase B-E unfinished)
- [ ] Wire `WizardCanvas` into wizard page sidebars (base, cover, finish, review)
- [ ] Cinematic phase transitions (GSAP camera dolly between wizard steps)
- [ ] Review page 3D cinematic reveal (particle burst, dust jacket fly-off)
- [ ] GSAP scroll parallax on landing (hero section)
- [ ] Pre-flight checklist + Cart + Checkout

---

## DEFINITION OF DONE (this sprint)

- [x] `packages/three/` foundation package built + type-clean
- [x] Procedural hardcover model with PBR materials
- [x] SSR-safe 3D canvas pattern (dynamic + ssr:false)
- [x] Web app builds without errors
- [x] Zustand store connected to 3D viewer
- [ ] Wizard pages have 3D preview sidebar
- [ ] Cinematic camera transitions between wizard phases
- [ ] Review page: full cinematic reveal
- [ ] Landing: GSAP scroll parallax animation
- [ ] Cart + Checkout simplified

---

## ERRORS ENCOUNTERED

Lihat [`./ERRORS.md`](./ERRORS.md)

### Key Learnings

1. **`packages/three` as workspace source**: Next.js webpack compiles `node_modules/@booxury/three` → resolved symlink → follows into `packages/three/src/`. `tsconfig exclude` only affects tsc, not webpack. Solution: keep only clean, self-contained exports in barrel, or build as compiled package with output dir.

2. **SSR-safe pattern**: Always use `dynamic({ ssr: false })` at the dynamic import call site. Never import Canvas at top-level of a Server Component. Keep `ssr: false` loading skeleton consistent with the rendered component dimensions.

3. **GSAP in R3F**: `gsap.registerPlugin()` must come AFTER `import gsap`. Use `gsap.context()` for React integration with automatic cleanup via `ctx.revert()`.

4. **packages/three + next/dynamic**: Don't put Next.js-specific imports in shared workspace packages. The web app handles its own `dynamic()` wrapping.

5. **Zustand fine-grained selectors**: For wizard preview, use individual selectors per prop (`sizeCode`, `coverFinish`, etc.) to avoid unnecessary re-renders. Only call `invalidate()` when Zustand state changes.

---

## NEXT STEPS (Hari 6)

1. **Wire WizardCanvas** into `/customize/base`, `/customize/cover`, `/customize/finish`, `/customize/review` sidebars
2. **Cinematic phase transitions**: GSAP camera dolly + book rotation tween between wizard steps (0.8s `power3.inOut`)
3. **Review page cinematic reveal**: Camera intro dolly, particle burst on finish toggle, dust jacket fly-off animation
4. **Landing GSAP scroll**: Connect ScrollTrigger to hero parallax + book rotation
5. **Pre-flight checklist** + Cart simplified
6. **PDF worker** (backend): queue polling, PDFKit + Sharp + ZIP generation

---

## Catatan

- Pivot dari CSS 3D ke R3F menambah kompleksitas tapi memberikan visual fidelity yang jauh lebih tinggi. Worth it untuk demo.
- User preference: "yang penting aspek-aspek yang bisa dikustomisasi masukkan ke dalam bagian kustom" — semua customization (corner shape, edge finish, dust jacket, headband, ribbon) sudah termodel di hardcover-model.tsx.
- Tech stack confirmed (Aug 2026): three@0.185.1, fiber@9.7.0, drei@10.7.8, postprocessing@3.1.0, gsap@3.15.0, motion@13.1.1
- API build failure pre-existing (TypeScript lib config), tidak terkait dengan sprint 3D ini.
