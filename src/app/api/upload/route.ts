import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: Request) {
  try {
    const nextRequest = request as NextRequest;
    requireAuth(nextRequest);

    const rateLimit = checkRateLimit(`upload:${getRateLimitKey(nextRequest)}`, 30, 60 * 1000);
    if (!rateLimit.success) {
      return Response.json({ error: 'Too many upload requests. Please try again later.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const filenameParam = searchParams.get('filename');

    if (!filenameParam) {
      return Response.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filename = filenameParam.replace(/[^a-zA-Z0-9._/-]/g, '_');
    if (filename.includes('..') || filename.startsWith('/')) {
      return Response.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!ALLOWED_TYPES.includes(contentType)) {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_FILE_SIZE) {
      return Response.json({ error: 'File too large' }, { status: 413 });
    }

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set');
      return Response.json({ error: 'Blob storage not configured' }, { status: 500 });
    }

    // Ensure request.body is not null
    if (!request.body) {
      return Response.json({ error: 'No file data provided' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    return Response.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}