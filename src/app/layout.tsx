import type { Metadata, Viewport } from 'next'

import { ProvedorSessao } from '@/components/ProvedorSessao'

import './globals.css'

export const metadata: Metadata = {
  title: 'Conexão',
  description: 'Cultive os relacionamentos mais importantes da sua vida.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <ProvedorSessao>{children}</ProvedorSessao>
      </body>
    </html>
  )
}
