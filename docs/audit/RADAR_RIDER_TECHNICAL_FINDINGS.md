# Radar Rider — Achados Técnicos

Commit: `5eaffa1` · Produção: www.radarrider.com · Data: 2026-07-24

Legenda de status: **CONFIRMED** (testado), **SUSPECTED** (indício, não provado end-to-end), **NOT VERIFIED** (inspeção insuficiente), **BLOCKED** (sem acesso).
Severidade: P0 (crítico) · P1 (bloqueador) · P2 (defeito maior) · P3 (menor) · P4 (melhoria).

---

## F-01 — CSP forte não chega ao navegador em produção
- **Severidade:** P2 · **Componente:** headers de segurança / camada Hostinger-LiteSpeed · **Status:** CONFIRMED
- **Evidência:** `curl -D-` em `/`, `/entrar` e `/api/health` (dinâmica, `no-store`) retorna **apenas** `content-security-policy: upgrade-insecure-requests`. O `next.config.ts` define uma CSP completa (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `script-src 'self' 'unsafe-inline'`, etc.). Os demais headers do config (`x-content-type-options`, `referrer-policy`, `x-frame-options`, `permissions-policy`) **aparecem** — só a CSP é substituída. `public_html/.htaccess` **não** contém diretiva de CSP → a substituição vem do vhost LiteSpeed/painel Hostinger ("forçar HTTPS").
- **Causa raiz:** header `Content-Security-Policy` do app é sobrescrito (`Header set`, semântica de replace) pela camada de servidor.
- **Impacto:** perde-se a mitigação de XSS (`script-src 'self'`) e de clickjacking pela CSP. **Mitigado** por `X-Frame-Options: SAMEORIGIN`, HSTS, ausência de `dangerouslySetInnerHTML` e escaping automático do React.
- **Reprodução:** `curl -s -D - -o /dev/null "https://www.radarrider.com/api/health" | grep -i content-security`
- **Recomendação:** reasseverar a CSP em `public_html/.htaccess` com `Header always set Content-Security-Policy "…"` (LiteSpeed permite o `.htaccess` sobrepor o vhost) **ou** desligar o override no painel. Requer ação no servidor + reteste. Não alterado nesta auditoria (regra: não mexer em produção sem aprovação).

## F-02 — Arquivos de `public/` driblam `headers()`; SW sem `Cache-Control`
- **Severidade:** P3 · **Componente:** PWA / static handler · **Status:** CONFIRMED
- **Evidência:** `curl -D-` em `/service-worker.js` retorna só `Content-Type: application/x-javascript`, **sem** o `Cache-Control: no-cache, no-store, must-revalidate` definido no `next.config.ts`. No servidor não há cópia estática em `public_html/` — o arquivo vem de `nodejs/public/`, servido pelo handler estático antes do Next.
- **Impacto:** o SW pode ser cacheado pelo navegador por padrão. **Mitigado** por `updateViaCache:'none'` + `reg.update()` adicionados no registro (commit `0cb099b`) e pelo auto-reload em `controllerchange`.
- **Reprodução:** `curl -s -D - -o /dev/null "https://www.radarrider.com/service-worker.js" | grep -i cache-control` (vazio).
- **Recomendação:** definir o header do SW via `.htaccess` (`<Files service-worker.js> Header set Cache-Control "no-cache"`), ou servir o SW por uma rota Next com rewrite. `Content-Type` idealmente `text/javascript`.

## F-03 — Cache velho no CDN para `/` (raiz do "site sem estilo")
- **Severidade:** P4 · **Componente:** CDN Hostinger · **Status:** CONFIRMED
- **Evidência:** primeira requisição a `/` sem cache-buster: `Cache-Control: s-maxage=31536000`, `x-nextjs-cache: HIT`, `Age: ~85000`, **sem HSTS** e **com** `x-powered-by: Next.js`. Com `?cb=RANDOM` (MISS): `s-maxage=60`, HSTS presente, sem `x-powered-by`. Ou seja, o edge guarda cópias antigas.
- **Impacto:** usuários podem receber HTML velho apontando para assets `/_next/static` já apagados por um deploy → página sem CSS (exatamente o sintoma reportado por um usuário nesta sessão).
- **Mitigação já aplicada:** `s-maxage=60` + `stale-while-revalidate` no config; auto-update do PWA.
- **Recomendação:** após cada deploy, purgar o cache do CDN da Hostinger (ou confirmar que o edge honra `s-maxage=60`). Documentar no runbook de deploy.

## F-04 — `DELETE /api/push/subscribe` sem verificação de dono (IDOR)
- **Severidade:** P3 · **Componente:** `src/app/api/push/subscribe/route.ts` · **Status:** CONFIRMED (código)
- **Evidência:** o handler `DELETE` faz `prisma.pushSubscription.deleteMany({ where: { endpoint } })` **sem** `getServerSession` nem checar `userId`. Quem souber o `endpoint` exato apaga a inscrição de outra pessoa.
- **Impacto:** baixo — o `endpoint` é uma string longa e não pública; no pior caso, cancela notificações de uma vítima cujo endpoint o atacante já conhece. Sem exposição de dados.
- **Recomendação:** exigir sessão e restringir ao dono: `deleteMany({ where: { endpoint, userId: session.user.id } })`. Corrigível localmente com segurança (ver Fix Plan).

## F-05 — `X-Forwarded-For` confiável na extração de IP
- **Severidade:** P4 · **Componente:** `src/lib/rate-limit.ts` (`ipDaRequisicao`) · **Status:** SUSPECTED
- **Evidência:** usa o **primeiro** valor de `x-forwarded-for`, que o cliente pode injetar se o proxy não sanear. Usado nos limites por IP de `/api/register` (3/h) e `/api/password/forgot`. O **login** limita por e-mail, então não é afetado.
- **Impacto:** um atacante poderia rodar o limite de cadastro/reset variando o XFF. Impacto real depende de o LiteSpeed reescrever o XFF (comum em hospedagem gerenciada) — não verificável só pelo código.
- **Recomendação:** confirmar o comportamento do proxy; se necessário, usar o hop confiável (último XFF) ou um cabeçalho controlado pela plataforma.

## F-06 — Política de senha sem checagem de senha vazada
- **Severidade:** P4 · **Componente:** `register`/`reset` (Zod `min(8)`) · **Status:** CONFIRMED
- **Evidência:** exige apenas ≥ 8 caracteres. Sem rejeição de senhas comuns/vazadas.
- **Impacto:** baixo (mín. 8 é aceitável por NIST; foco em comprimento). Melhoria: checagem HIBP (k-anonymity) ou lista de senhas comuns.

## F-07 — `Content-Type` do service worker
- **Severidade:** P4 · **Status:** CONFIRMED
- **Evidência:** SW servido como `application/x-javascript`. Funciona nos navegadores atuais, mas `text/javascript` é o padrão recomendado. Junto de F-02.

## F-08 — `sitemap.xml` retorna 404
- **Severidade:** P4 (não-issue) · **Status:** CONFIRMED
- **Evidência:** `GET /sitemap.xml` → 404. O `robots.txt` **não** referencia sitemap, então não há link quebrado. Aceitável para um app com poucas páginas indexáveis. Opcional adicionar `app/sitemap.ts` para as páginas legais/públicas.

---

## Itens NÃO verificados / BLOCKED (requerem ação ou acesso)
- **Entrega de e-mail SMTP (envio real):** BLOCKED — não disparei e-mail de verificação/reset para não gerar mensagem real. Teste manual em `RADAR_RIDER_TEST_RESULTS.md`.
- **Push em iOS PWA instalado:** NOT VERIFIED — requer iPhone físico com o app na Tela de Início (iOS 16.4+).
- **Ações destrutivas de moderação (hide/remove/suspend/ban) em produção:** não testadas para não afetar dados reais. Lógica de autorização revisada no código (403 para não-staff, guarda anti-autoescalada).
- **`prisma migrate status` contra o banco de produção:** NOT VERIFIED — comando read-only recomendado, a rodar no servidor (ver Test Results).
- **Lighthouse / perfil de performance:** NOT VERIFIED — não executado nesta passada.
