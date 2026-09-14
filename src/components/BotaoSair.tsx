'use client'

import { signOut } from 'next-auth/react'

import { Botao } from '@/components/ui/Botao'

export function BotaoSair() {
  return (
    <Botao variante="fantasma" tamanho="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
      Sair
    </Botao>
  )
}
