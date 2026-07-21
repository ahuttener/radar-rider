import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { publicAlertSelect, toPublicAlerts } from '@/lib/alert-visibility';

export const dynamic = 'force-dynamic';

/**
 * Os alertas de quem está logado, incluindo os que já expiraram.
 *
 * Rota separada de propósito: o filtro por autor acontece no servidor, a partir
 * da sessão. Não existe parâmetro de usuário — senão bastaria trocar um id na
 * URL para descobrir tudo que outra pessoa publicou, que é justamente o que o
 * anonimato do alerta precisa impedir.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ alerts: [] });
  }

  const alerts = await prisma.alert.findMany({
    where: { userId: session.user.id },
    select: publicAlertSelect,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ alerts: toPublicAlerts(alerts) });
}
