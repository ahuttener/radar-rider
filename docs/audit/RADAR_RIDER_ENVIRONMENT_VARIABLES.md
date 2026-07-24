# Radar Rider — Variáveis de Ambiente

Commit `5eaffa1` · 2026-07-24 · **Nenhum valor real é exibido.**

Inventário extraído de `process.env.*` no código + `.env.example`. Classificação: **server** (só servidor) / **public** (embutida no bundle do cliente, `NEXT_PUBLIC_`).

| Variável | Ambiente | Público/Server | Formato esperado | Consumo | Obrigatória | Validação | Em `.env.example` | Status |
|---|---|---|---|---|---|---|---|---|
| `DATABASE_URL` | prod/dev | server | `mysql://user:pass@host:3306/db` | `prisma`, `src/lib/prisma.ts` | **Sim** | Prisma valida na conexão; `app.js` desfaz o escape `\%` do painel | Sim | OK (banco `connected`) |
| `NEXTAUTH_URL` | prod/dev | server | `https://www.radarrider.com` | NextAuth, `register` (link do e-mail) | **Sim** | fallback para o domínio no `register` | Sim | OK |
| `NEXTAUTH_SECRET` | prod/dev | server | string aleatória ≥ 32 bytes | NextAuth (interno) | **Sim** | NextAuth exige em produção | Sim | Presumido OK (login funciona) |
| `CRON_SECRET` | prod | server | string aleatória forte | `api/cron/retention` | **Sim** (senão 503) | comparado ao header/`?key=` | Sim | OK (200 no teste) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | prod/dev | **public** | base64url (chave pública VAPID) | `push.ts`, `NotificacoesPush.tsx` | Sim (para push) | `pushConfigurado()` no-op se faltar | Sim | OK (push entregou) |
| `VAPID_PRIVATE_KEY` | prod | server | base64url (chave privada) | `push.ts` | Sim (para push) | idem | Sim | OK |
| `VAPID_SUBJECT` | prod | server | `mailto:…` ou `https://…` | `push.ts` | Não | valida formato; senão usa padrão | Sim | OK |
| `SMTP_HOST` | prod | server | hostname | `mailer.ts` | Sim (e-mail) | — | Sim | NOT VERIFIED (envio) |
| `SMTP_PORT` | prod | server | número (465/587) | `mailer.ts` | Sim (e-mail) | — | Sim | NOT VERIFIED |
| `SMTP_USER` | prod | server | usuário SMTP | `mailer.ts` | Sim (e-mail) | — | Sim | NOT VERIFIED |
| `SMTP_PASS` | prod | server | senha SMTP (**segredo**) | `mailer.ts` | Sim (e-mail) | — | Sim | NOT VERIFIED |
| `MAIL_FROM` | prod | server | `Nome <endereco@dominio>` | `mailer.ts` | Sim (e-mail) | — | Sim | NOT VERIFIED |
| `LEGAL_CONTROLLER_NAME` | prod | server | texto | página `/privacidade` | Recomendada | opcional no código | Sim | **Pendente no painel** (só no `.env` via SSH; reverte no deploy) |
| `LEGAL_CONTROLLER_ADDRESS` | prod | server | texto | `/privacidade` | **Opcional** (decisão: não expor) | opcional | **Não** (proposital) | OK (deixar vazio) |
| `PRIVACY_EMAIL` | prod | server | e-mail | `/privacidade`, RGPD | Recomendada | opcional | Sim | **Pendente no painel** |
| `NEXT_PUBLIC_SUPPORT_URL` | prod/dev | **public** | URL | UI de suporte | Não | opcional | Sim | OK |
| `PORT` / `HOST` | prod | server | número / host | `app.js` | plataforma | fallback 3000/0.0.0.0 | — (plataforma) | OK |
| `NODE_ENV` | prod/dev | server | `production`/`development` | runtime | plataforma | — | — | OK |

## Verificações de segurança de segredos — **PASS**
- Nenhum segredo com prefixo `NEXT_PUBLIC_` (só a chave **pública** VAPID e a URL de suporte).
- `VAPID_PRIVATE_KEY`, `SMTP_PASS`, `DATABASE_URL` **não** aparecem em bundle do cliente (server-only).
- `.env` no `.gitignore` e ausente do histórico do Git.
- `.env.example` sem valores reais.

## Pendências de ambiente (ações do dono no painel Hostinger)
1. Fixar `LEGAL_CONTROLLER_NAME`, `PRIVACY_EMAIL` e `CRON_SECRET` **no painel** — hoje sobrevivem só no `.env` do servidor e **revertem a cada deploy**. (Cada gravação de env no painel dispara um deploy → exige recuperação por SSH.)
2. **Não** cadastrar `LEGAL_CONTROLLER_ADDRESS` (decisão de não expor endereço do controlador).
3. Lembrar: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` é **build-time** — trocar exige rebuild.
