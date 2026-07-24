# Radar Rider — Auditoria Executiva

**Data:** 2026-07-24
**Commit auditado:** `5eaffa1` (branch `main`)
**Produção:** https://www.radarrider.com — versão do app `3.0.0`, `/api/health` → `database: connected`
**Escopo:** código do repositório `ahuttener/radar-rider` + comportamento da produção ao vivo + banco (diagnóstico read-only por SSH).

---

## Nota de prontidão: **8.0 / 10**

App de qualidade acima da média, com decisões de segurança e privacidade deliberadas e bem documentadas. Está **operando corretamente em produção**. Os pontos abertos são **uma configuração de servidor (CSP)** e **melhorias operacionais**, não defeitos de código que impeçam o uso.

---

## Resumo executivo

O Radar Rider é um PWA Next.js 16 / React 19 / Prisma (MySQL na Hostinger) para alertas comunitários de segurança de entregadores na Irlanda e Reino Unido. A auditoria confirmou, **com evidência**, que:

- O **build está saudável**: `tsc` sem erros, ESLint limpo, `prisma validate` OK, **10/10 testes** passam, `npm audit` **0 vulnerabilidades**.
- A **produção está no ar e corresponde ao commit atual** (`5eaffa1` no servidor = `main`).
- **Autenticação, autorização, tokens, rate limiting e privacidade de localização** estão implementados corretamente e conferidos linha a linha.
- **Nenhum vazamento de coordenada exata** em respostas públicas (verificado na API de produção).
- **Notificações push funcionam de ponta a ponta** (teste real entregue no aparelho do dono).

O achado mais relevante é de **configuração de produção**, não de código: a **Content-Security-Policy forte definida no `next.config.ts` não chega ao navegador** — a camada LiteSpeed/Hostinger a substitui por apenas `upgrade-insecure-requests`. O impacto é mitigado por `X-Frame-Options`, HSTS, ausência de `dangerouslySetInnerHTML` e escaping do React, mas a CSP deveria ser restaurada.

## A produção está operando corretamente?
**SIM (PARTIAL nos headers).** Home 200, banco conectado, APIs respondendo, push entregando, redirect canônico e HTTPS OK. Ressalva: CSP enfraquecida e alguns headers ausentes em cópias cacheadas do CDN.

## O repositório compila corretamente?
**SIM (PASS).** Todos os gates locais passam.

## O deploy está atual?
**SIM (PASS).** `git rev-parse HEAD` no servidor = `5eaffa1`, idêntico ao `main`. Build `ZAQsgb37fmW2L6FuV9vcQ` gerado nesta sessão.

## Riscos principais
1. **CSP substituída pela Hostinger** (P2, segurança) — proteção anti-XSS/clickjacking da CSP não ativa.
2. **Headers de `public/` (SW, manifest) driblam o `next.config`** (P3) — SW sem `Cache-Control: no-cache`.
3. **Cache velho no CDN** para `/` (P4) — causa raiz do "site sem estilo" relatado; mitigado por `s-maxage=60`.
4. **Operacional** (P3) — deploy apaga `.env`/`.next` (recuperação manual), sem rollback automático nem rastreamento de erros.

## Recomendação de lançamento
**GO condicional.** O app pode operar em produção. Antes de divulgação ampla, recomenda-se: (a) restaurar a CSP na camada de servidor; (b) fixar as 3 variáveis pendentes no painel; (c) confirmar backup/restauração. Nenhum item é bloqueador absoluto de disponibilidade.

## Ações imediatas
1. Restaurar CSP forte via `.htaccess` (`Header always set`) ou desligar o override da Hostinger — **exige ação no servidor + reteste**.
2. Fixar `LEGAL_CONTROLLER_NAME`, `PRIVACY_EMAIL`, `CRON_SECRET` no painel (hoje só no `.env` via SSH, revertem no deploy).
3. Concluir o cron externo (URL `?key=` no cron-job.org, hora em hora).
4. Confirmar rotina de backup e testar uma restauração.

Detalhes em `RADAR_RIDER_TECHNICAL_FINDINGS.md`, `RADAR_RIDER_SECURITY_REVIEW.md` e `RADAR_RIDER_FIX_PLAN.md`.
