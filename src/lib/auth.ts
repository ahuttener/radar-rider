import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Sessão por JWT, sem tabela de sessão.
// O app só tem login por e-mail e senha; guardar sessão no banco custaria uma
// consulta a cada requisição sem nada em troca. Se um dia entrar login com
// Google, aí sim entram o adapter e as tabelas Account/Session.

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name: string; role: string };
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/entrar' },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Compara mesmo sem usuário, contra um hash descartável. Sem isso, a
        // resposta volta na hora para e-mail inexistente e demora para e-mail
        // existente — dá para descobrir quem tem conta cronometrando.
        const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliduu';
        const confere = await bcrypt.compare(password, hash);

        if (!user || !confere) return null;
        if (user.deletedAt) return null;
        // Conta não confirmada não entra: senão qualquer um cria conta com o
        // e-mail de outra pessoa e passa a publicar alerta em nome dela.
        if (!user.emailVerifiedAt) throw new Error('EMAIL_NAO_CONFIRMADO');

        return { id: user.id, email: user.email, name: user.displayName, role: user.role };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      // O papel vive no token por 30 dias. Sem reler, alguém rebaixado de
      // moderador continuaria moderando até a sessão vencer.
      if (trigger === 'update' || (token.uid && !user)) {
        const atual = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { role: true, displayName: true, deletedAt: true },
        });
        if (!atual || atual.deletedAt) return {};
        token.role = atual.role;
        token.name = atual.displayName;
      }
      return token;
    },

    async session({ session, token }) {
      if (!token.uid) return session;
      session.user = {
        id: token.uid as string,
        email: token.email as string,
        name: (token.name as string) ?? 'Rider',
        role: (token.role as string) ?? 'user',
      };
      return session;
    },
  },
};

export function ehStaff(role?: string) {
  return role === 'admin' || role === 'moderator';
}
