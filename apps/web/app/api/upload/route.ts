import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: { code: 'INVALID_FILE', message: 'File harus gambar.' } }, { status: 422 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: { code: 'FILE_TOO_LARGE', message: 'Maksimum 10MB.' } }, { status: 422 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Upload gagal.' } }, { status: 500 });
  }
}
