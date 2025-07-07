'use client';

import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function HomePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files || files.length === 0) {
      setMessage('Por favor, selecciona al menos una imagen.');
      return;
    }

    setMessage('Procesando imágenes...');
    const newResults: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const imageData = await file.arrayBuffer();

        const {
          data: { text },
        } = await Tesseract.recognize(imageData, 'spa', {
          logger: m => console.log(m),
        });

        newResults.push(text.trim());
      } catch (err) {
        console.error(`Error procesando ${file.name}:`, err);
        newResults.push('Error al procesar esta imagen.');
      }
    }

    setResults(newResults);
    setMessage(`Se han procesado ${newResults.length} imagen(es) correctamente.`);
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
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Subir Imágenes para OCR</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2 p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Subir y Procesar
        </button>
      </form>

      {message && (
        <p className={message.includes('Error') ? 'text-red-500' : 'text-green-500'}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <>
          <button
            onClick={downloadCSV}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
          >
            Descargar CSV
          </button>

          <table className="mt-6 w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-4 py-2">Fecha</th>
                <th className="border border-black px-4 py-2">Numero de operacion</th>
                <th className="border border-black px-4 py-2">Monto</th>
                <th className="border border-black px-4 py-2">Cuenta Origen</th>
                <th className="border border-black px-4 py-2">Cuenta Destino</th>
                <th className="border border-black px-4 py-2">Destinatario</th>
                <th className="border border-black px-4 py-2">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td className="border border-black px-4 py-2">
                    {extractFecha2025(result) || 'N/A'}
                  </td>
                  <td className="border border-black px-4 py-2">
                    {extractNumeroOperacion(result) || 'N/A'}
                  </td>
                  <td className="border border-black px-4 py-2">
                    {extractMontoFallback(result) || 'N/A'}
                  </td>
                  <td className="border border-black px-4 py-2">0000</td>
                  <td className="border border-black px-4 py-2">0000</td>
                  <td className="border border-black px-4 py-2">
                    {extractDestinatario(result) || 'N/A'}
                  </td>
                  <td className="border border-black px-4 py-2">
                    {removeFileExtension(files?.[index]?.name || '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
