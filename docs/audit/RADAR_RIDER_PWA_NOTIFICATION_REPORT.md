# Radar Rider — PWA e Notificações

Commit `5eaffa1` · 2026-07-24

## Manifest — **PASS**
- `GET /manifest.json` → 200 `application/json`. Ícones em `public/`: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `badge-sino.png`. `manifest.json` está entre os `ESTATICOS` do SW.
- Recomendação de verificação (browser): confirmar `display: standalone`, `start_url`, `scope`, `theme_color`, `background_color` no DevTools → Application → Manifest (NOT VERIFIED via HTTP puro).

## Service Worker — **PASS** (2 ressalvas)
- `public/service-worker.js` (`radar-rider-v7`). Deliberadamente conservador: **não** cacheia HTML nem `/api/` (ferramenta de segurança não pode mostrar rua "limpa" desatualizada). Cacheia só assets versionados (`/_next/static/`) e os `ESTATICOS`.
- `install` → `skipWaiting`; `activate` → limpa caches antigos + `clients.claim`.
- **Auto-update (commit `0cb099b`):** cliente escuta `controllerchange` e recarrega **uma vez** (guardado por flag e só se já havia controller); registro com `updateViaCache:'none'` + `reg.update()`. Resolve o clássico "SW velho servindo JS obsoleto".
- **Ressalva F-02:** em produção o SW é servido **sem** `Cache-Control: no-cache` (o header do `next.config` não se aplica a arquivos de `public/`). Mitigado pelo `updateViaCache:'none'`.
- **Ressalva F-07:** `Content-Type: application/x-javascript` (funciona; `text/javascript` é o padrão).

## Comportamento offline — **PASS (por design)**
- Sem fallback de navegação offline: intencional. Alertas sempre vêm da rede; nada de alerta obsoleto em cache. Falha de rede em asset não-cacheado apenas não resolve (não quebra o app).

## VAPID — **PASS**
- `src/lib/push.ts`: lê `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública, exposta ao cliente — correto), `VAPID_PRIVATE_KEY` (server-only), `VAPID_SUBJECT` (validado: precisa ser `mailto:`/`http(s)`, senão cai no padrão). `pushConfigurado()` faz o recurso virar no-op se faltar chave (nada quebra).
- **Build-time:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` é embutida no bundle do cliente → **trocar a chave exige novo build/deploy**, não só variável de ambiente. Confirmado no fluxo de deploy desta sessão.

## Fluxo de inscrição — **PASS**
1. `src/components/NotificacoesPush.tsx`: botão só aparece se `serviceWorker`+`PushManager`+chave pública existem; permissão pedida **após** clique do usuário; negação tratada com mensagem clara.
2. Conversão base64url→Uint8Array correta (`chaveParaBytes`).
3. `POST /api/push/subscribe`: **sessão obrigatória**; Zod valida `endpoint`(url,≤500)/`p256dh`/`auth`/`country`(IE|GB); `upsert` por `endpoint` (**unicidade** garantida) associando ao `userId`.
4. Envio: `notificarPais(country)` envia só às inscrições daquele país; endpoints mortos (404/410) são apagados; nunca lança (não derruba a rota que dispara).
5. Payload mínimo `{title, body, url}` — **sem coordenada exata nem dado pessoal**.
6. **Selo no ícone (commit `c01fb19`):** SW chama `setAppBadge()` no `push` e limpa no `notificationclick` e no `visibilitychange` do cliente.
- **Ressalva (F-04):** `DELETE /api/push/subscribe` não checa dono — corrigir. Exclusão de conta apaga as inscrições (`account/delete`).

## Entrega de push — **PASS (verificado no aparelho do dono)**
- Havia **1** inscrição (o dono, IE, Chrome/Android). Disparo de teste com as chaves VAPID reais → **recebido no aparelho**. Endpoint FCM válido.

## Compatibilidade por navegador
| Plataforma | Status |
|---|---|
| Android Chrome (instalado/aba) | **PASS** — entrega confirmada |
| Chrome desktop | PASS esperado (mesma API) — NOT VERIFIED explicitamente |
| Samsung Internet | NOT VERIFIED |
| **iPhone Safari (aba)** | **por design não recebe push** — iOS exige PWA instalado |
| **iPhone PWA instalado (iOS 16.4+)** | NOT VERIFIED (requer device); ativar as notificações **de dentro do app na Tela de Início**, nunca da aba do Safari |

## Passos para concluir a configuração de push
1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` presentes no `.env` do servidor — **OK** (push entregou).
2. Como a chave pública é build-time, **qualquer rotação de chave VAPID exige rebuild + deploy** (seguir o runbook de deploy).
3. Para iPhone: instruir o usuário a **Adicionar à Tela de Início** e ativar as notificações por dentro do app instalado.
4. Aplicar F-04 (dono no `DELETE`) antes de abrir push a muitos usuários.
