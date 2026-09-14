import { NextRequest, NextResponse } from 'next/server'

import { sincronizarSugestoesDoUsuario } from '@/lib/cadencia'
import { prisma } from '@/lib/prisma'

// ============================================================================
// Job agendado (Vercel Cron, ver vercel.json) que gera as sugestões de
// contato pendentes 1x por dia para todos os usuários — mesmo que ninguém
// abra o app naquele dia. A geração "na hora" (ao carregar o painel, ver
// src/app/page.tsx) continua existindo: sincronizarSugestoesDoUsuario nunca
// duplica uma sugestão já pendente, então rodar os dois não causa problema.
// ----------------------------------------------------------------------------
// Protegido pela variável de ambiente CRON_SECRET: a Vercel envia esse valor
// sozinha no cabeçalho Authorization em toda chamada agendada (ver
// docs/DEPLOY.md) — sem isso, qualquer pessoa poderia chamar essa rota.
// ============================================================================

export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET
  const autorizacao = request.headers.get('authorization')
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const usuarios = await prisma.user.findMany({ select: { id: true } })
  for (const usuario of usuarios) {
    await sincronizarSugestoesDoUsuario(usuario.id)
  }

  return NextResponse.json({ usuariosProcessados: usuarios.length })
}
