'use client'

import { signIn } from 'next-auth/react'

import { Botao } from '@/components/ui/Botao'

export function BotaoEntrarCom({
  provider,
  children,
}: {
  provider: 'google' | 'facebook' | 'demo'
  children: React.ReactNode
}) {
  return (
    <Botao
      type="button"
      variante={provider === 'demo' ? 'secundario' : 'primario'}
      className="w-full"
      onClick={() => signIn(provider, { callbackUrl: '/' })}
    >
      {children}
    </Botao>
  )
}
