# Radar Rider — Checklist de Lançamento

Commit `5eaffa1` · 2026-07-24 · Status: **PASS** / **FAIL** / **BLOCKED** / **NOT VERIFIED** / **PARTIAL**

## Build & qualidade de código
- [x] TypeScript sem erros — **PASS**
- [x] ESLint limpo — **PASS**
- [x] Testes automatizados (10/10) — **PASS**
- [x] `prisma validate` — **PASS**
- [x] `npm audit` 0 vulnerabilidades — **PASS**
- [x] Build de produção conclui (`BUILD_ID` gerado) — **PASS**
- [x] Sem `dangerouslySetInnerHTML`/`eval`/`: any`/`@ts-ignore` — **PASS**

## Deploy & produção
- [x] Produção no commit atual (`5eaffa1`) — **PASS**
- [x] `GET /` 200, `/api/health` `database:connected` — **PASS**
- [x] Redirect apex→www (307) e http→https (301) — **PASS**
- [x] Source maps não expostos (404) — **PASS**
- [x] CSP forte aplicada — **PASS** (F-01 corrigido via `.htaccess`; verificado em produção, sobrevive a deploy git)
- [x] HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy — **PASS**
- [ ] `Cache-Control` do service worker — **PARTIAL** (F-02; header não aplicável ao arquivo proxied, mas mitigado por `updateViaCache:'none'` + auto-reload)
- [ ] Cache do CDN purgado pós-deploy — **PARTIAL** (F-03; `s-maxage=60` aplicado, purga manual recomendada)
- [ ] Rollback automatizado — **FAIL** (recuperação é manual por SSH; documentada)

## Banco de dados
- [x] Schema válido, índices e unicidades presentes — **PASS**
- [x] Sem vazamento de coordenada exata na API pública — **PASS**
- [x] `sitemap.xml` — **PASS** (F-08 corrigido: `app/sitemap.ts`, 30 URLs públicas, 200 em produção)
- [ ] `prisma migrate status` contra produção — **NOT VERIFIED** (comando read-only fornecido)
- [ ] Backup diário confirmado + restauração testada — **PARTIAL** (backup indicado em sessão anterior; restauração não testada)

## Autenticação & contas
- [x] bcrypt 12, anti-enumeração por timing, rate-limit de login — **PASS**
- [x] Invalidação de sessão por troca de senha / exclusão — **PASS**
- [x] Tokens de uso único, hasheados, com expiração — **PASS**
- [x] Exclusão de conta RGPD (anonimiza e-mail/nome, apaga telefone e push subs, borra coordenadas) — **PASS**
- [ ] Fluxo registro→verificação→login→reset com conta real — **NOT VERIFIED**
- [ ] Envio real de e-mail (SMTP) — **BLOCKED**

## Autorização
- [x] Todas as rotas mutáveis checam sessão server-side — **PASS**
- [x] Moderação exige staff (403), anti-autoescalada — **PASS**
- [x] `DELETE /api/push/subscribe` valida dono — **PASS** (F-04 corrigido; sem sessão → 401, verificado em produção)

## PWA & notificações
- [x] `manifest.json` 200 e ícones presentes — **PASS**
- [x] Service worker registra, atualiza (`v7`) e auto-recarrega — **PASS**
- [x] Inscrição de push (sessão + Zod + upsert por endpoint) — **PASS**
- [x] Entrega de push confirmada em Android/Chrome — **PASS**
- [ ] Push em iPhone PWA instalado — **NOT VERIFIED** (requer device)
- [x] Payload sem coordenada/dado pessoal — **PASS**

## Privacidade & conteúdo
- [x] Serializer público allow-list (dupla proteção) — **PASS**
- [x] Borrão de coordenada no servidor — **PASS**
- [x] Páginas legais (termos, privacidade, cookies, RGPD, moderação, segurança infantil) presentes — **PASS**
- [ ] Guia de emergência (não substitui 112/999; não confrontar) visível na UI — **NOT VERIFIED** (revisar render final)

## Cron / retenção
- [x] `/api/cron/retention` protegida (Bearer + `?key=`), 200 no teste — **PASS**
- [ ] Job externo agendado hora em hora — **PARTIAL** (URL `?key=` pronta; falta o dono salvar/agendar no cron-job.org)

## Configuração pendente (dono)
- [ ] `LEGAL_CONTROLLER_NAME`, `PRIVACY_EMAIL`, `CRON_SECRET` fixos no painel — **PARTIAL**
- [ ] Restaurar CSP (Fase 2.1) — **pendente**
- [ ] DMARC — **PARTIAL** (indicado OK em sessão anterior, sem `rua`)

## Veredicto de go-live
**GO condicional.** Disponibilidade e funções centrais **PASS**. Antes de divulgação ampla: resolver F-01 (CSP), F-04 (dono no DELETE de push), concluir cron e fixar env no painel. Nenhum item é bloqueador absoluto de operação.
