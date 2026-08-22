# Radar Rider — Resultados de Teste

Commit `5eaffa1` · 2026-07-24 · Node 22 (`/opt/alt/alt-nodejs22` no servidor; `v24` local para os gates)

## 1. Comandos executados (locais, não-destrutivos)

| Comando | Resultado | Observação |
|---|---|---|
| `npx tsc --noEmit` | **PASS** (sem saída) | tipos válidos |
| `npx eslint .` | **PASS** (sem erros) | só disables legítimos de `@next/next/no-img-element` |
| `npm test` (`node --test t/*.test.mjs`) | **PASS** — 10/10 | timing de auth + geo/privacidade de coordenada |
| `npx prisma validate` | **PASS** | "schema is valid 🚀" |
| `npm audit --omit=dev` | **PASS** | 0 vulnerabilidades |
| `git ls-files \| grep '^.env$'` | **PASS** | `.env` não versionado; ausente no histórico |
| build de produção | **PASS** | executado no servidor nesta sessão; `BUILD_ID=ZAQsgb37fmW2L6FuV9vcQ` |

### Cobertura dos testes automatizados (`t/`)
- `auth-timing.test.mjs` — comparação bcrypt contra hash descartável leva o mesmo tempo (anti-enumeração por cronometragem). **PASS**
- `geo.test.mjs` — separação IE/GB por coordenada; borrão público (~100 m) idempotente; distância; rejeição de coordenada inválida. **PASS**
- `alert-visibility.test.mjs` — serializer público. **PASS**

## 2. Testes de produção (HTTP, ao vivo)

| Teste | Resultado |
|---|---|
| `GET /` | 200 |
| `GET /api/health` | 200 · `{status:ok, database:connected, version:3.0.0}` |
| Redirect `radarrider.com` → `www` | 307 → `https://www.radarrider.com/` |
| Redirect `http://` → `https://` | 301 |
| `GET /robots.txt` | 200 · `text/plain` · bloqueia `/api/`, `/moderacao*`, telas de auth |
| `GET /manifest.json` | 200 · `application/json` |
| `GET /service-worker.js` | 200 · `application/x-javascript` · **sem** `Cache-Control` (F-02) |
| `GET /sitemap.xml` | 404 (não referenciado — F-08) |
| Source maps `.js.map` | 404 (não expostos) — **PASS** |
| Headers `x-content-type-options / referrer-policy / x-frame-options / permissions-policy` | presentes — **PASS** |
| HSTS `max-age=63072000; includeSubDomains; preload` | presente em resposta MISS/dinâmica — **PASS** |
| `Content-Security-Policy` | **FAIL** — só `upgrade-insecure-requests` (F-01) |
| `x-powered-by` | ausente em resposta fresca (**PASS**); presente só em cópia velha do CDN (F-03) |

## 3. Teste da API pública de dados (privacidade)
`GET /api/alerts` (produção) retornou 3 alertas com **apenas** campos públicos: `latitudePublic/longitudePublic` (arredondados), sem `latitudePrivate`, `longitudePrivate`, `userId` nem `passwordHash`. **PASS** — nenhum vazamento de coordenada exata.

## 4. Cron de retenção
- `GET /api/cron/retention?key=<REDACTED>` → **200** `{status:ok, alertasExpirados, coordenadasApagadas, tokensRemovidos, alertasRemovidosPorIdade}`.
- Chave errada → **401**. Sem segredo configurado → **503**. **PASS**.

## 5. Notificações push (end-to-end)
- Inscrições no banco: **1** (`<e-mail do dono>`, país IE, endpoint FCM/Chrome-Android).
- Disparo de teste via `web-push` + chaves VAPID do `.env` → **entregue e recebido no aparelho do dono** (confirmado). **PASS**.

## 6. Marcador do mapa (UI, Chrome headless)
- Reproduzido `divIcon` + CSS reais em Chrome `--headless`: 3 pinos renderizados, 0 imagens quebradas, clique dispara o handler. **PASS**.
- `fitBounds` com as coordenadas reais dos alertas centraliza o mapa em Newbridge com os 3 pinos visíveis. **PASS**.

## 7. NÃO verificado / a executar
- **Fluxo completo de registro→verificação→login→reset** com conta de teste dedicada: **NOT VERIFIED** (não criei conta real na produção). Ver plano abaixo.
- **Envio real de e-mail (SMTP):** **BLOCKED**. Teste manual seguro:
  1. Criar conta de teste com um e-mail que você controle em `/entrar` (aba criar conta).
  2. Confirmar recebimento do e-mail de confirmação; medir o tempo; conferir que o link `/confirmar?token=…` funciona **uma vez** e falha ao reusar.
  3. `/esqueci-a-senha` com esse e-mail; conferir link `/nova-senha`, uso único, e que sessões antigas caem após trocar a senha.
- **`prisma migrate status` (read-only) contra produção:** rodar no servidor:
  ```
  cd ~/domains/radarrider.com/nodejs && export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH && npx prisma migrate status
  ```
- **Lighthouse / performance:** não executado.
- **Push em iOS PWA instalado:** requer iPhone físico.
