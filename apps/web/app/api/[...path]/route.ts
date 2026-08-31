import { NextRequest, NextResponse } from 'next/server';
import { computeSpineWidth } from '@booxury/spine-calc';

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Base size base prices in IDR
const SIZE_PRICES: Record<string, number> = {
  A5: 35000,
  B5: 45000,
  A6: 25000,
};

const PAPER_PRICES: Record<string, number> = {
  BOOK57: 400,
  BOOK72: 450,
  BOOK90: 550,
  HVS70: 350,
  HVS80: 400,
  HVS100: 500,
  ART120: 600,
  ART150: 750,
  MATT120: 650,
  MATT150: 800,
};

const COVER_MODIFIERS: Record<string, number> = {
  doff: 0,
  glossy: 0,
  canvas: 15000,
  leatherette: 25000,
};

const EDGE_MODIFIERS: Record<string, number> = {
  plain: 0,
  gilded_gold: 20000,
  gilded_silver: 20000,
  sprayed_red: 10000,
  sprayed_blue: 10000,
  stenciled: 8000,
};

// Fallback pricing calculation if backend API is offline
function calculateFallbackPriceQuote(body: Record<string, unknown>) {
  const sizeCode = (body.sizeCode as string) ?? 'A5';
  const pages = typeof body.pages === 'number' ? body.pages : 100;
  const paperCode = (body.paperCode as string) ?? 'BOOK72';
  const boardCode = (body.boardCode as string) ?? 'BOARD20';
  const endpaperCode = (body.endpaperCode as string) ?? 'ENDPLAIN';
  const coverFinish = (body.coverFinish as string) ?? 'doff';
  const cornerShape = (body.cornerShape as string) ?? 'square';
  const edgeFinish = (body.edgeFinish as string) ?? 'plain';
  const hasDustJacket = Boolean(body.hasDustJacket);
  const headbandCode = body.headbandCode as string | undefined;
  const ribbonCodes = Array.isArray(body.ribbonCodes) ? (body.ribbonCodes as string[]) : [];

  const spineWidthMm = computeSpineWidth({
    pages,
    paperCode,
    boardCode,
    endpaperCode,
    sizeCode,
  });

  const breakdown: Array<{ item: string; amount: number }> = [];
  let total = 0;

  // Base size
  const basePrice = SIZE_PRICES[sizeCode] ?? 35000;
  total += basePrice;
  breakdown.push({ item: `Base hardcover ${sizeCode}`, amount: basePrice });

  // Paper
  const paperUnit = PAPER_PRICES[paperCode] ?? 450;
  const paperTotal = paperUnit * pages;
  total += paperTotal;
  breakdown.push({ item: `Kertas ${paperCode} × ${pages} hal`, amount: paperTotal });

  // Greyboard
  const boardPrice = 2000;
  total += boardPrice;
  breakdown.push({ item: `Greyboard ${boardCode}`, amount: boardPrice });

  // Endpaper
  const endpaperPrice = endpaperCode === 'ENDPAT' ? 6000 : 2000;
  total += endpaperPrice;
  breakdown.push({ item: `Endpaper ${endpaperCode}`, amount: endpaperPrice });

  // Cover finish
  const coverMod = COVER_MODIFIERS[coverFinish] ?? 0;
  if (coverMod > 0) {
    total += coverMod;
    breakdown.push({ item: `Cover finish: ${coverFinish}`, amount: coverMod });
  }

  // Corner round
  if (cornerShape === 'round') {
    total += 5000;
    breakdown.push({ item: 'Corner shaping: round', amount: 5000 });
  }

  // Edge finish
  const edgeMod = EDGE_MODIFIERS[edgeFinish] ?? 0;
  if (edgeMod > 0) {
    total += edgeMod;
    breakdown.push({ item: `Edge finish: ${edgeFinish}`, amount: edgeMod });
  }

  // Dust jacket
  if (hasDustJacket) {
    total += 8000;
    breakdown.push({ item: 'Dust jacket', amount: 8000 });
  }

  // Headband
  if (headbandCode) {
    total += 2000;
    breakdown.push({ item: `Headband ${headbandCode}`, amount: 2000 });
  }

  // Ribbons
  for (const ribbon of ribbonCodes) {
    total += 3000;
    breakdown.push({ item: `Ribbon marker ${ribbon}`, amount: 3000 });
  }

  return {
    spine_width_mm: spineWidthMm,
    total,
    breakdown,
  };
}

async function proxy(req: NextRequest, options: { method?: string; body?: unknown } = {}) {
  const url = new URL(req.url);
  const targetPath = `${url.pathname}${url.search}`;
  const authHeader = req.headers.get('authorization');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  try {
    const res = await fetch(`${API_BASE}${targetPath}`, {
      method: options.method ?? req.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Non-JSON: forward as binary to preserve PDF/image bytes
    const arrayBuf = await res.arrayBuffer();
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType || 'application/octet-stream',
    };
    const disp = res.headers.get('content-disposition');
    if (disp) responseHeaders['Content-Disposition'] = disp;
    const cc = res.headers.get('cache-control');
    if (cc) responseHeaders['Cache-Control'] = cc;
    return new NextResponse(Buffer.from(arrayBuf), {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.warn(`API proxy failed for ${targetPath}:`, (err as Error)?.message);

    // Fallback for price-quote if backend server is unreachable
    if (url.pathname.endsWith('/price-quote') && options.body) {
      const quote = calculateFallbackPriceQuote(options.body as Record<string, unknown>);
      return NextResponse.json(quote);
    }

    return NextResponse.json(
      {
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Backend server is currently starting or unavailable.',
        },
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  let body: unknown = undefined;
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  return proxy(req, { method: 'POST', body });
}

export async function PUT(req: NextRequest) {
  let body: unknown = undefined;
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  return proxy(req, { method: 'PUT', body });
}

export async function PATCH(req: NextRequest) {
  let body: unknown = undefined;
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  return proxy(req, { method: 'PATCH', body });
}

export async function DELETE(req: NextRequest) {
  return proxy(req, { method: 'DELETE' });
}
