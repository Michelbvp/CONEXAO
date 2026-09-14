import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { BotaoEntrarCom } from '@/components/BotoesLogin'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions, providersDisponiveis } from '@/lib/auth'

export default async function PaginaLogin() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/')

  const nenhumProviderConfigurado =
    !providersDisponiveis.google && !providersDisponiveis.facebook && !providersDisponiveis.demo

  return (
    <main className="flex min-h-screen items-center justify-center bg-marfim px-4 py-12">
      <Cartao className="w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl">Conexão</h1>
          <p className="mt-2 text-sm text-prata-600">
            Cultive os relacionamentos mais importantes da sua vida.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {providersDisponiveis.google && (
            <BotaoEntrarCom provider="google">Entrar com Google</BotaoEntrarCom>
          )}
          {providersDisponiveis.facebook && (
            <BotaoEntrarCom provider="facebook">Entrar com Facebook</BotaoEntrarCom>
          )}
          {providersDisponiveis.demo && (
            <>
              {(providersDisponiveis.google || providersDisponiveis.facebook) && (
                <div className="my-1 flex items-center gap-3 text-xs text-prata-500">
                  <span className="h-px flex-1 bg-prata-200" />
                  ou
                  <span className="h-px flex-1 bg-prata-200" />
                </div>
              )}
              <BotaoEntrarCom provider="demo">Entrar em modo demonstração</BotaoEntrarCom>
            </>
          )}
        </div>

        {nenhumProviderConfigurado && (
          <p className="mt-6 text-center text-sm text-prata-600">
            Nenhum provedor de login está configurado ainda. Preencha as
            credenciais do Google/Facebook no arquivo <code>.env</code> ou
            ative <code>ALLOW_DEMO_LOGIN=true</code> para testar localmente
            — veja <code>docs/DEPLOY.md</code>.
          </p>
        )}
      </Cartao>
    </main>
  )
}
