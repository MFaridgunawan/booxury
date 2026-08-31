import sharp from 'sharp';

export interface BookVisualInput {
  bookWidthMm: number;
  bookHeightMm: number;
  spineMm: number;
  coverColor: string;
  coverTextureUrl?: string;
  spineText?: string;
  edgeFinish?: string;
  headbandColor?: string;
  ribbonColor?: string;
  boardThicknessMm?: number;
}

type P3 = { x: number; y: number; z: number };
type Pt = [number, number];

function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt)));
  g = Math.max(0, Math.min(255, Math.round(g + amt)));
  b = Math.max(0, Math.min(255, Math.round(b + amt)));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const pth = (pts: Pt[]): string =>
  'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' Z';

/** Build a genuine 3/4 isometric standing book as SVG. */
export function buildBookSvg(inp: BookVisualInput): string {
  const cc = inp.coverColor || '#1a1a1a';
  const hb = inp.headbandColor || '';
  const rb = inp.ribbonColor || '';
  const pg = '#f4ecd8';
  const eg = inp.edgeFinish === 'plain' ? '#efe6d3' : '#d4bf6a';

  const yaw = -0.42, pitch = 0.34, cx = 300, cy = 340, scale = 1.15;

  const rot = (p: P3): P3 => {
    const cyy = Math.cos(yaw), sy = Math.sin(yaw);
    let q = { x: p.x * cyy + p.z * sy, y: p.y, z: -p.x * sy + p.z * cyy };
    const cxx = Math.cos(pitch), sx = Math.sin(pitch);
    q = { x: q.x, y: q.y * cxx - q.z * sx, z: q.y * sx + q.z * cxx };
    return q;
  };
  const P = (p: P3): Pt => {
    const r = rot(p);
    return [cx + r.x * scale, cy - r.y * scale];
  };

  const H = 290, W = 210, D = 62;
  const boardT = Math.max(9, (inp.boardThicknessMm ?? 2.0) * 7);
  const BW = W + 28, BH = H + 16;

  // box corners centered passed via zc
  const B = (w: number, h: number, d: number, zc: number): P3[] => [
    { x: -w / 2, y: h / 2, z: -d / 2 + zc }, { x: w / 2, y: h / 2, z: -d / 2 + zc },
    { x: w / 2, y: -h / 2, z: -d / 2 + zc }, { x: -w / 2, y: -h / 2, z: -d / 2 + zc },
    { x: -w / 2, y: h / 2, z: d / 2 + zc }, { x: w / 2, y: h / 2, z: d / 2 + zc },
    { x: w / 2, y: -h / 2, z: d / 2 + zc }, { x: -w / 2, y: -h / 2, z: d / 2 + zc },
  ];
  const F = (c: P3[], idx: number[]): Pt[] => idx.map(i => P(c[i]));
  const line = (a: Pt, b: Pt, stroke: string, w: number): string =>
    '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) +
    '" y2="' + b[1].toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + w + '"/>';

  const S: string[] = [];

  function pushBox(c: P3[], fill: string, paper: boolean, edge: boolean): { front: Pt[]; right: Pt[]; top: Pt[] } {
    const top = F(c, [0, 1, 5, 4]);
    const right = F(c, [1, 2, 6, 5]);
    const left = F(c, [0, 3, 7, 4]);
    const front = F(c, [0, 1, 2, 3]);
    // top
    if (paper) {
      S.push('<path d="' + pth(top) + '" fill="' + shade(pg, 40) + '"/>');
      for (let i = 1; i <= 22; i++) {
        const t = i / 23;
        S.push(line([top[0][0] + (top[1][0] - top[0][0]) * t, top[0][1] + (top[1][1] - top[0][1]) * t],
                    [top[3][0] + (top[2][0] - top[3][0]) * t, top[3][1] + (top[2][1] - top[3][1]) * t], '#cfc3a0', 0.6));
      }
    } else {
      S.push('<path d="' + pth(top) + '" fill="' + shade(fill, 46) + '"/>');
    }
    // right (page edge or spine)
    if (edge) {
      S.push('<path d="' + pth(right) + '" fill="' + shade(eg, 14) + '"/>');
      for (let i = 1; i <= 22; i++) {
        const t = i / 23;
        S.push(line([right[0][0] + (right[1][0] - right[0][0]) * t, right[0][1] + (right[1][1] - right[0][1]) * t],
                    [right[3][0] + (right[2][0] - right[3][0]) * t, right[3][1] + (right[2][1] - right[3][1]) * t], '#e6dec8', 0.5));
      }
    } else {
      S.push('<path d="' + pth(right) + '" fill="' + shade(fill, -24) + '"/>');
    }
    S.push('<path d="' + pth(left) + '" fill="' + shade(fill, -32) + '"/>');
    S.push('<path d="' + pth(front) + '" fill="' + fill + '"/>');
    return { front, right, top };
  }

  // 1) page block
  pushBox(B(W, H, D, 0), pg, true, true);

  // 2) back board at -z (peeks behind page block into the +y-turn gap) — draw darker
  pushBox(B(BW, BH, boardT, -D / 2 - boardT / 2), shade(cc, -18), false, false);

  // 3) front cover board at +z
  const fc = B(BW, BH, boardT, D / 2 + boardT / 2);
  const cov = pushBox(fc, cc, false, false);
  const frontFace = cov.front;

  // artwork on cover
  if (inp.coverTextureUrl) {
    const b64 = inp.coverTextureUrl.split(',')[1] || '';
    if (b64) {
      const x = frontFace[0][0] + 6, y = frontFace[1][1] + 6;
      const w = Math.abs(frontFace[1][0] - frontFace[0][0]) - 12;
      const h = Math.abs(frontFace[2][1] - frontFace[1][1]) - 12;
      S.push('<image x="' + x + '" y="' + y + '" width="' + Math.max(1, w).toFixed(1) +
        '" height="' + Math.max(1, h).toFixed(1) + '" href="data:image/png;base64,' + b64 +
        '" preserveAspectRatio="xMidYMid meet"/>');
    }
  } else {
    const mw = frontFace[0][0] + Math.abs(frontFace[1][0] - frontFace[0][0]) / 2;
    const mh = frontFace[1][1] + Math.abs(frontFace[2][1] - frontFace[1][1]) / 2;
    S.push('<text x="' + mw.toFixed(1) + '" y="' + mh.toFixed(1) +
      '" fill="rgba(255,255,255,0.6)" font-family="Georgia, serif" font-size="22" text-anchor="middle" font-style="italic">BOOXURY</text>');
  }

  // sheen overlay on cover
  S.push('<path d="' + pth(frontFace) + '" fill="url(#sheen)"/>');

  // 4) spine text on right face of front board
  if (inp.spineText) {
    const r = cov.right;
    const mx = (r[0][0] + r[1][0]) / 2, my = (r[0][1] + r[3][1]) / 2;
    S.push('<text x="' + mx.toFixed(1) + '" y="' + my.toFixed(1) + '" fill="#ece6d4" font-family="Georgia, serif" font-size="13" text-anchor="middle" transform="rotate(90 ' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')">' + inp.spineText + '</text>');
  }

  // 5) headband strips at spine top & bottom (front board right edge)
  if (hb) {
    const rt = cov.top;
    // top headband: small bar along the right edge of top cover face
    const a: Pt = [(rt[1][0] + rt[2][0]) / 2, (rt[1][1] + rt[2][1]) / 2];
    const b: Pt = [(rt[0][0] + rt[3][0]) / 2, (rt[0][1] + rt[3][1]) / 2];
    S.push('<path d="' + pth([rt[1], rt[2], b, a]) + '" fill="' + hb + '" opacity="0.95"/>');
    // bottom headband: on front cover bottom edge, spine corner
    const fr = F(fc, [3, 2, 6, 7]);
    S.push('<path d="' + pth([fr[0], fr[1], fr[3]]) + '" fill="' + hb + '" opacity="0.95"/>');
  }

  // 6) greyboard ledger: dark strip at cover bottom
  {
    const bb = F(fc, [2, 3, 6, 7]);
    S.push('<path d="' + pth([bb[0], bb[1], [bb[2][0] + 6, bb[2][1] + 3], [bb[3][0] + 6, bb[3][1] + 3]]) + '" fill="' + shade(cc, -38) + '"/>');
  }

  // 7) ribbon draped over cover
  if (rb) {
    const x0 = frontFace[0][0] + (frontFace[1][0] - frontFace[0][0]) * 0.3;
    const y0 = frontFace[1][1] - 2;
    const yEnd = frontFace[1][1] + (frontFace[2][1] - frontFace[1][1]) * 0.9;
    const mid = (y0 + yEnd) / 2;
    S.push('<path d="M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' C ' + x0.toFixed(1) + ' ' + mid.toFixed(1) + ' ' + (x0 + 28).toFixed(1) + ' ' + (yEnd - 16).toFixed(1) + ' ' + (x0 + 20).toFixed(1) + ' ' + yEnd.toFixed(1) + '" fill="none" stroke="' + rb + '" stroke-width="6.5" stroke-linecap="round"/>');
    S.push('<path d="M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' C ' + (x0 - 4).toFixed(1) + ' ' + mid.toFixed(1) + ' ' + (x0 - 8).toFixed(1) + ' ' + (yEnd - 32).toFixed(1) + ' ' + (x0 - 14).toFixed(1) + ' ' + (yEnd - 24).toFixed(1) + '" fill="none" stroke="' + rb + '" stroke-width="4" stroke-linecap="round"/>');
    S.push('<path d="M ' + (x0 + 20).toFixed(1) + ' ' + yEnd.toFixed(1) + ' L ' + (x0 + 14).toFixed(1) + ' ' + (yEnd + 10).toFixed(1) + ' L ' + (x0 + 26).toFixed(1) + ' ' + (yEnd + 10).toFixed(1) + ' Z" fill="' + rb + '"/>');
  }

  // 8) drop shadow ellipse under the book
  const lowY = frontFace[2][1];
  S.push('<ellipse cx="' + cx.toFixed(1) + '" cy="' + (lowY + 30).toFixed(1) + '" rx="' + ((W + D) * scale * 0.5).toFixed(1) + '" ry="15" fill="#000" opacity="0.18"/>');

  // defs: sheen + subtle floor
  S.unshift('<defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="white" stop-opacity="0.22"/>' +
    '<stop offset="15%" stop-color="white" stop-opacity="0.05"/>' +
    '<stop offset="100%" stop-color="black" stop-opacity="0.08"/></linearGradient></defs>');

  // Fixed viewBox from known geometry (ax must contain all draws with margin)
  const xb = [cx - (BW + 30) * scale, cx + (BW + 30) * scale];
  const yb = [cy - (H + 40) * scale, cy + (D * scale) + 60];
  const vx = Math.floor(xb[0]), vy = Math.floor(yb[0]), vw = Math.ceil(xb[1] - xb[0]), vh = Math.ceil(yb[1] - yb[0]);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + vw + '" height="' + vh + '" viewBox="' + vx + ' ' + vy + ' ' + vw + ' ' + vh + '">' +
    '<rect x="' + vx + '" y="' + vy + '" width="' + vw + '" height="' + vh + '" fill="#f6f2e8"/>' +
    S.join('') + '</svg>';
  return svg;
}

export async function renderBookPng(svg: string, width: number): Promise<Buffer> {
  // bound BOTH dimensions to avoid sharp oversizing; keep aspect
  return sharp(Buffer.from(svg)).resize({ width, height: Math.round(width * 1.1), fit: 'inside' }).png().toBuffer();
}