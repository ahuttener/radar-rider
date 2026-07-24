# Radar Rider — Plano de Correção

Commit base `5eaffa1` · 2026-07-24

Nenhuma correção foi aplicada nesta auditoria (regra: reportar antes de mudar). Abaixo, o plano faseado. Cada item de código indica arquivos, efeito e teste.

## Fase 1 — Bloqueadores críticos
Nenhum P0/P1 confirmado. **O app está apto a operar.**

## Fase 2 — Segurança e privacidade

### 2.1 — Restaurar a CSP em produção (F-01, P2) — *ação de servidor*
- **Onde:** `public_html/.htaccess` no servidor (não no repositório) **ou** painel Hostinger.
- **O quê:** reasseverar a CSP forte com `Header always set Content-Security-Policy "…"` (copiar a do `next.config.ts`), ou desligar o override "forçar HTTPS/CSP" do painel.
- **Efeito:** navegador volta a receber `default-src 'self'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline'; …`.
- **Teste:** `curl -s -D- -o/dev/null https://www.radarrider.com/api/health | grep -i content-security` deve mostrar a CSP completa.
- **Risco/rollback:** baixo; se algo quebrar (asset bloqueado), remover a linha do `.htaccess` reverte na hora. **Requer aprovação do dono** (mexe em produção).

### 2.2 — `DELETE /api/push/subscribe` exigir dono (F-04, P3) — *código, seguro localmente*
- **Arquivo:** `src/app/api/push/subscribe/route.ts`.
- **Fix:** exigir `getServerSession`; `deleteMany({ where: { endpoint, userId: session.user.id } })`. Manter o comportamento de "desligar no próprio aparelho".
- **Teste:** novo caso em `t/` ou manual — DELETE sem sessão → 401; com sessão, só apaga a própria inscrição.
- **Deploy:** junto do próximo ciclo.

### 2.3 — Header do service worker (F-02/F-07, P3) — *servidor*
- **Onde:** `public_html/.htaccess` — `<Files "service-worker.js"> Header set Cache-Control "no-cache, no-store, must-revalidate"; Header set Content-Type "text/javascript"</Files>`.
- **Teste:** `curl -D-` no SW mostra `Cache-Control` e `text/javascript`.

## Fase 3 — Confiabilidade e operações

### 3.1 — Endurecer extração de IP (F-05, P4) — *código*
- **Arquivo:** `src/lib/rate-limit.ts` (`ipDaRequisicao`). Confirmar como o LiteSpeed passa o `X-Forwarded-For`; se o cliente puder injetar, usar o hop confiável.

### 3.2 — Runbook de deploy + purga de cache (F-03) — *doc/processo*
- Documentar o ciclo (push→deploy apaga `.env`/`.next`→recuperação por SSH) e **purgar o cache do CDN** após cada deploy. Já há receita nesta sessão; formalizar em `docs/`.

### 3.3 — Observabilidade — *melhoria*
- Sem rastreamento de erros (Sentry/afins). Avaliar log estruturado + captura de exceção. Health check já existe (`/api/health`).

### 3.4 — Migrações e backup
- Rodar `npx prisma migrate status` (read-only) no servidor e registrar. Confirmar backup diário do banco e **testar uma restauração**.

## Fase 4 — Performance e acessibilidade
- **Perf:** rodar Lighthouse; revisar tamanho de bundle e uso de `<img>` (há disables de `no-img-element`).
- **A11y:** auditar foco visível, contraste, rótulos dos controles só-ícone (barra inferior), e o fluxo do botão "Ativar notificações" e de permissão de localização (estados de negação).

## Fase 5 — Melhorias futuras
- Checagem de senha vazada (HIBP k-anonymity) no registro/reset (F-06).
- `app/sitemap.ts` para as páginas legais/públicas (F-08).
- Migração das 3 env pendentes para o painel (durabilidade entre deploys).
- Considerar CSP com nonce (remover `'unsafe-inline'` de `script-src`) quando viável.

## Ordem recomendada de execução
1. **2.1** (CSP, maior ganho de segurança) — servidor, com aprovação.
2. **2.2 + 2.3** no próximo deploy de código.
3. **3.2** (runbook/purga) — imediato, sem código.
4. Fase 4/5 conforme prioridade de lançamento.
