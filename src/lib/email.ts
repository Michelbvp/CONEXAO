// ============================================================================
// Envio de e-mail de lembrete (Resend) quando surgem novas sugestões de
// contato pendentes — ver src/app/api/cron/sugestoes/route.ts.
// ----------------------------------------------------------------------------
// Opcional: sem RESEND_API_KEY configurada, o app funciona normalmente e
// simplesmente não envia e-mails (mesmo padrão do Google/Facebook, ver
// src/lib/auth.ts). Nunca lança exceção — uma falha aqui não pode impedir a
// geração das sugestões em si.
//
// Sem verificar um domínio próprio no Resend (ver docs/DEPLOY.md), a conta
// gratuita só entrega para o e-mail do dono da própria conta Resend — o que
// é exatamente o caso de uso aqui: um app de uso pessoal, para uma pessoa só.
// ============================================================================

import { Resend } from 'resend'
import { TipoContato } from '@prisma/client'

import { ROTULO_TIPO_CONTATO } from '@/lib/rotulos'

const emailConfigurado = Boolean(process.env.RESEND_API_KEY)
const resend = emailConfigurado ? new Resend(process.env.RESEND_API_KEY) : null
const REMETENTE = process.env.EMAIL_REMETENTE || 'Conexão <onboarding@resend.dev>'

export type SugestaoParaEmail = {
  nomePessoa: string
  tipoSugerido: TipoContato
  motivo: string
}

/** Devolve true só quando o e-mail foi mesmo enviado (usado para contagens/logs). */
export async function enviarLembreteSugestoes(
  destinatario: string,
  sugestoes: SugestaoParaEmail[],
): Promise<boolean> {
  if (!resend || sugestoes.length === 0) return false

  const assunto =
    sugestoes.length === 1
      ? 'Você tem 1 sugestão de contato pendente no Conexão'
      : `Você tem ${sugestoes.length} sugestões de contato pendentes no Conexão`

  const linhas = sugestoes
    .map((s) => `- ${s.nomePessoa} (${ROTULO_TIPO_CONTATO[s.tipoSugerido]}) — ${s.motivo}`)
    .join('\n')

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: destinatario,
      subject: assunto,
      text: `${assunto}:\n\n${linhas}\n\nAbra o Conexão para confirmar ou recusar cada uma.`,
    })
    return true
  } catch (erro) {
    console.error('Falha ao enviar e-mail de lembrete de sugestões:', erro)
    return false
  }
}
