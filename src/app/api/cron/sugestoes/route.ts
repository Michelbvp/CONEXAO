import { NextRequest, NextResponse } from 'next/server'

import { sincronizarSugestoesDoUsuario } from '@/lib/cadencia'
import { enviarLembreteSugestoes } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// ============================================================================
// Job agendado (Vercel Cron, ver vercel.json) que gera as sugestões de
// contato pendentes 1x por dia para todos os usuários — mesmo que ninguém
// abra o app naquele dia. A geração "na hora" (ao carregar o painel, ver
// src/app/page.tsx) continua existindo: sincronizarSugestoesDoUsuario nunca
// duplica uma sugestão já pendente, então rodar os dois não causa problema.
//
// Quando surgem sugestões novas de verdade, envia um e-mail de lembrete
// (ver src/lib/email.ts) — sem isso, o usuário só saberia ao abrir o app.
// Sem RESEND_API_KEY configurada, o envio simplesmente não acontece; a
// geração das sugestões nunca depende do e-mail funcionar.
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

  const usuarios = await prisma.user.findMany({ select: { id: true, email: true } })

  let usuariosNotificados = 0
  for (const usuario of usuarios) {
    const novasSugestoes = await sincronizarSugestoesDoUsuario(usuario.id)
    if (novasSugestoes.length > 0 && usuario.email) {
      const enviado = await enviarLembreteSugestoes(usuario.email, novasSugestoes)
      if (enviado) usuariosNotificados++
    }
  }

  return NextResponse.json({ usuariosProcessados: usuarios.length, usuariosNotificados })
}
