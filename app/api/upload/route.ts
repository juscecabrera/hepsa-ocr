import { NextRequest } from 'next/server';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

// Define el path absoluto del worker (solo si usas workerPath manual)
const workerPath = require.resolve('tesseract.js/dist/worker.min.js');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    const results: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const processed = await sharp(buffer).grayscale().toBuffer();

      const {
        data: { text },
      } = await Tesseract.recognize(processed, 'spa', {
        // Puedes omitir esto si no quieres usar worker personalizado
        // logger: m => console.log(m), // Debug opcional
      });

      results.push(text.trim());
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('OCR error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500,
    });
  }
}
