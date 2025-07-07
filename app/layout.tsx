import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Basic Image Upload',
  description: 'A simple Next.js app for uploading multiple images',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}