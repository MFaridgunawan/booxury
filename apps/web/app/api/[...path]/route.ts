import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001';

async function proxy(path: string, req: NextRequest, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/', '/');
  return proxy(path, req);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/', '/');
  const body = await req.json();
  return proxy(path, req, { method: 'POST', body });
}
