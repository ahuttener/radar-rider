# Radar Rider — Revisão de Segurança

Commit `5eaffa1` · 2026-07-24

## Autenticação — **PASS**
- `src/lib/auth.ts`: NextAuth com `CredentialsProvider`, sessão **JWT** (30 dias).
- Senha com **bcrypt custo 12** (`register`, `reset`, `delete`).
- **Anti-enumeração por timing:** compara sempre contra um `HASH_DESCARTAVEL` gerado por bcrypt quando o e-mail não existe (testado em `auth-timing.test.mjs`).
- **Anti-força-bruta:** 10 falhas por conta / 15 min (só falhas contam), apoiado em `RateHit` no banco (compartilhado entre processos).
- Login recusa conta **deletada, banida, suspensa e não confirmada**, com mensagens específicas mas sem revelar existência da conta no fluxo público.
- E-mail normalizado (`trim().toLowerCase()`) de forma consistente em login/registro.

## Sessão — **PASS**
- Papel (`role`) relido do banco no refresh do JWT → moderador rebaixado perde acesso sem esperar a sessão vencer.
- `passwordChangedAt`: token emitido antes da última troca de senha é invalidado (expulsa sessões após reset). Coberto em `reset`.
- Exclusão de conta seta `passwordChangedAt` e `deletedAt` → sessões caem.
- Cookies de sessão do NextAuth (HttpOnly/Secure/SameSite) sob domínio canônico único (`NEXTAUTH_URL=www`), evitando sessão presa a host errado.

## Autorização / Controle de acesso — **PASS** (1 exceção P3)
Matriz verificada rota a rota (server-side, sem depender da UI):

| Rota | Regra |
|---|---|
| `GET /api/alerts` | público (só campos públicos) |
| `POST /api/alerts` | sessão obrigatória (401) |
| `GET /api/alerts/mine` | sessão; filtra por `userId` próprio |
| `POST /api/alerts/[id]/confirm` `/report` | sessão; unicidade `(alert,user)` no schema |
| `GET /api/account/export`, `DELETE /api/account/delete` | sessão; opera só sobre `session.user.id` |
| `GET /api/moderation/reports`, `PATCH .../[id]`, `PATCH /moderation/users/[id]` | **`ehStaff` → 403**; impede agir sobre si mesmo e sobre outro staff (anti-escalada) |
| `GET|POST /api/cron/retention` | `CRON_SECRET` (Bearer **ou** `?key=`) |
| `GET /api/health` | público (sem dado sensível) |

**Exceção (F-04, P3):** `DELETE /api/push/subscribe` apaga por `endpoint` **sem** checar sessão/dono (IDOR de baixo impacto).

## Privacidade de localização — **PASS** (crítico)
- Separação `latitudePrivate`/`latitudePublic` no schema; o borrão (~100 m) é feito **no servidor** (`publicCoord`), nunca vindo do cliente.
- `src/lib/alert-visibility.ts` centraliza o serializer público (allow-list) com **dupla proteção**: `select` do Prisma + `toPublicAlert`. Coordenada exata só por `staffOnlyExactLocation` (nome explícito, sem uso em rota pública).
- Verificado na **API de produção**: `/api/alerts` não expõe `latitudePrivate`, `longitudePrivate` nem `userId`.
- Confirmação de alerta valida distância no servidor (recusa > 2 km).

## Segurança de API — **PASS**
- Validação com **Zod** em todas as rotas com corpo (`register`, `alerts`, `reset`, `forgot`, `report`, `confirm`, `push/subscribe`, `account/delete`).
- `JSON.parse` protegido com try/catch → 400 em corpo inválido.
- Sem `dangerouslySetInnerHTML`, sem `eval`/`new Function`, sem `: any` solto, sem `@ts-ignore` — varredura limpa.
- Descrição do alerta renderizada via React (`{a.description}`) → escaping automático, sem XSS armazenado.
- `Cache-Control: no-store` nas rotas `/api/*`; respostas de moderação `private, no-store`.

## Tokens — **PASS**
- `src/lib/tokens.ts`: 256 bits de entropia (`randomBytes(32)`), armazenado como **SHA-256** (nunca o token cru).
- Uso único **atômico** (`updateMany` com `usedAt:null`) resistente a corrida/duplo-clique; expiração curta no reset (1 h) e 24 h na verificação; token novo invalida os anteriores.

## Cabeçalhos — **PARTIAL**
- Presentes: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy` (geolocation self; camera/mic negados), **HSTS preload**, `poweredByHeader:false` (efetivo em resposta fresca).
- **FAIL (F-01):** CSP forte do `next.config.ts` substituída por `upgrade-insecure-requests` na camada Hostinger. Restaurar.
- **P3 (F-02):** SW sem `Cache-Control` (arquivo de `public/`).

## Rate limiting / anti-abuso — **PASS** (1 ressalva)
- Apoiado em banco (`RateHit`), compartilhado entre processos; **falha aberta** (banco fora não tranca usuário legítimo).
- Limites: login 10 falhas/15 min (por e-mail); registro 3 válidos/hora (por IP); alerta 3/10 min (por usuário).
- **Ressalva (F-05):** extração de IP confia no 1º `X-Forwarded-For` (potencialmente falsificável) — afeta limites por IP, não o login.

## Dependências — **PASS**
- `npm audit --omit=dev`: **0 vulnerabilidades**. Stack enxuta (`next`, `next-auth`, `@prisma/*`, `bcryptjs`, `zod`, `web-push`, `nodemailer`, `leaflet`).

## Segredos — **PASS**
- `.env` no `.gitignore`, ausente do histórico. Nenhum segredo com prefixo `NEXT_PUBLIC_` além da **chave pública VAPID** e `NEXT_PUBLIC_SUPPORT_URL` (públicos por natureza). Chave privada VAPID e SMTP só no servidor. `.env.example` sem valores.

## Resumo de risco
Nenhum P0/P1. Um P2 de **configuração** (CSP), um P3 de código (IDOR de push), e ajustes P4. Postura de segurança **forte** para o estágio do produto.
