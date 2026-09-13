'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

// SessionProvider usa Context/hooks do React, então precisa ser um
// Client Component — o layout raiz (Server Component) só o envolve.
export function ProvedorSessao({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
