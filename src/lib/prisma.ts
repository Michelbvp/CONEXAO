import { PrismaClient } from '@prisma/client'

// Padrão recomendado pela própria Prisma para Next.js em modo dev: evita
// criar uma nova conexão com o banco a cada hot-reload do servidor,
// reaproveitando a instância guardada no objeto global do Node.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
