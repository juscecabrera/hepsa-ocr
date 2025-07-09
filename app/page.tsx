'use client';

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function HomePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setResults([]);
    setMessage('');
    setProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files || files.length === 0) {
      setMessage('Por favor, selecciona al menos una imagen.');
      return;
    }

    setMessage('Procesando imágenes...');
    const newResults: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(file, 'spa', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(((i + m.progress) / totalFiles) * 100);
            }
          },
        });

        newResults.push(text.trim());
        setResults([...newResults]); // Actualizar resultados en tiempo real
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
        newResults.push('Error al procesar esta imagen.');
        setResults([...newResults]);
      }
    }

    setMessage(`Se han procesado ${newResults.length} imagen(es) correctamente.`);
    setProgress(100);
  };

  function extractMontoFallback(input: string): string | null {
    const regex = /[S5]\/\s?\d+(?:,\d{3})*(?:\.\d{2})?/;
    const match = input.match(regex);
    return match ? match[0].replace(/^5\//, 'S/').replace(/\s+/, ' ') : null;
  }

  function extractFecha2025(input: string): string | null {
    const regex = /(\d{1,2})\s+([a-zA-ZñÑáéíóúÁÉÍÓÚ]+)\s+2025/;
    const match = input.match(regex);
    if (match) {
      const [, dia, mes] = match;
      return `${dia} ${mes} 2025`;
    }
    return null;
  }

  function extractDestinatario(input: string): string | null {
    const regex = /\bEnv(?:iar|iad[oa]|íar|i(?:ar|ad[oa])|u(?:ar|ad[oa])|v1ar|vlar|viar|vad[oa]|l[oa])\s+a\s+([^\n*]+?)(?:\n|\*\*)/i;
    const match = input.match(regex);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  }

  function extractNumeroOperacion(input: string): string | null {
    const regex = /n[uú]m(?:ero|era)?\s+de\s+operaci[oó]n\s+(\d{6,})/i;
    const match = input.match(regex);
    return match ? match[1] : null;
  }

  function removeFileExtension(filename: string): string {
    return filename.replace(/\.[a-zA-Z0-9]{3,4}$/, '').trim();
  }

  const downloadCSV = () => {
    if (!files || results.length === 0) return;

    const header = [
      'Fecha',
      'Numero de operacion',
      'Monto',
      'Cuenta Origen',
      'Cuenta Destino',
      'Destinatario',
      'Descripcion (nombre del archivo)',
    ];

    const rows = results.map((result, index) => [
      extractFecha2025(result) || 'N/A',
      extractNumeroOperacion(result) || 'N/A',
      extractMontoFallback(result) || 'N/A',
      '0000',
      '0000',
      extractDestinatario(result) || 'N/A',
      removeFileExtension(files[index]?.name || ''),
    ]);

    const csvContent =
      [header, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resultados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="p-6 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Subir Imágenes para OCR</h1>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-row gap-4">
        <Input 
          type='file'
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2 border rounded w-[30%]"
          id='file-input'
        />
        <Button
          type="submit"
          className="text-white px-4 py-2 rounded"
        >
          Subir y Procesar
        </Button>
      </form>

      {message && (
        <p className={message.includes('Error') ? 'text-red-500' : 'text-green-500'}>
          {message}
        </p>
      )}

      {progress > 0 && (
        <div className="my-4">
          <p className='my-2'>Progreso: {Math.round(progress)}%</p>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {results.length > 0 && (
        <>
          <Button
            onClick={downloadCSV}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
            variant="outline"
          >
            Descargar CSV
          </Button>

          <Table className="mt-6 min-w-[100%]">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-black px-4 py-2">Fecha</TableHead>
                <TableHead className="border border-black px-4 py-2">Numero de operacion</TableHead>
                <TableHead className="border border-black px-4 py-2">Monto</TableHead>
                <TableHead className="border border-black px-4 py-2">Cuenta Origen</TableHead>
                <TableHead className="border border-black px-4 py-2">Cuenta Destino</TableHead>
                <TableHead className="border border-black px-4 py-2">Destinatario</TableHead>
                <TableHead className="border border-black px-4 py-2">Descripcion (nombre de archivo)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="border border-black px-4 py-2">
                    {extractFecha2025(result) || 'N/A'}
                  </TableCell>
                  <TableCell className="border border-black px-4 py-2">
                    {extractNumeroOperacion(result) || 'N/A'}
                  </TableCell>
                  <TableCell className="border border-black px-4 py-2">
                    {extractMontoFallback(result) || 'N/A'}
                  </TableCell>
                  <TableCell className="border border-black px-4 py-2">0000</TableCell>
                  <TableCell className="border border-black px-4 py-2">0000</TableCell>
                  <TableCell className="border border-black px-4 py-2">
                    {extractDestinatario(result) || 'N/A'}
                  </TableCell>
                  <TableCell className="border border-black px-4 py-2">
                    {removeFileExtension(files?.[index]?.name || '')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </main>
  );
}