import { PrismaClient } from '@prisma/client';

// Em desenvolvimento o Next recarrega os módulos a cada alteração. Sem guardar
// o cliente no globalThis, cada recarga abre um pool novo e o MySQL derruba a
// aplicação por excesso de conexões depois de alguns minutos editando.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
