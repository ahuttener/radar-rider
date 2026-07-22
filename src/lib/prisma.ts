import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// A conexão passa por um driver MySQL em JavaScript, não pelo motor Rust do
// Prisma — ver a nota em prisma/schema.prisma. O driver aceita as opções
// separadas, então a DATABASE_URL é desmontada aqui.
function opcoesDoBanco() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não está definida.');

  const { hostname, port, username, password, pathname } = new URL(url);

  return {
    // Precisa ser 127.0.0.1, nunca "localhost": localhost resolve para IPv6 e
    // o usuário do MySQL não tem permissão nesse endereço.
    host: hostname,
    port: port ? Number(port) : 3306,
    user: decodeURIComponent(username),
    password: decodeURIComponent(password),
    database: pathname.replace(/^\//, ''),
    // A hospedagem compartilhada é apertada de processo e de conexão; um pool
    // largo aqui derruba o MySQL antes de derrubar o app.
    connectionLimit: 3,
  };
}

// Em desenvolvimento o Next recarrega os módulos a cada alteração. Sem guardar
// o cliente no globalThis, cada recarga abre um pool novo e o MySQL derruba a
// aplicação por excesso de conexões depois de alguns minutos editando.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb(opcoesDoBanco()),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
