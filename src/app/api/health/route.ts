import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Health check para monitoramento externo (uptime, pós-deploy).
// Devolve só informação operacional segura — nada de URL de banco, variável de
// ambiente, stack trace, hostname ou contagem de usuários.
export async function GET() {
  const timestamp = new Date().toISOString();
  let database: 'connected' | 'error' = 'error';

  try {
    // Consulta mínima só para confirmar que o banco responde.
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'error';
  }

  const status = database === 'connected' ? 'ok' : 'degraded';
  return NextResponse.json(
    { status, database, version: '3.0.0', timestamp },
    { status: database === 'connected' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
