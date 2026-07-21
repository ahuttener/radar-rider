# Radar Rider

PWA de segurança comunitária para motociclistas e entregadores na Irlanda e no
Reino Unido. Um rider publica um alerta de risco; quem está perto vê no mapa e
confirma. A localização é sempre divulgada de forma aproximada.

Sem framework e sem build: são arquivos estáticos + Supabase. Publicar é copiar
a pasta para o `public_html`.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` · `app.js` · `styles.css` | o app |
| `admin.html` | painel de moderação (denúncias, alertas por país, usuários) |
| `supabase.sql` | banco inteiro: tabelas, RLS, funções e os dois patches de segurança |
| `manifest.json` · `service-worker.js` · `icon-*.png` | o que faz virar app instalável |
| `config.example.js` | modelo das chaves; vire `config.js` no servidor |
| `emails/` | templates de e-mail e como ligar o SMTP |
| `t/` | testes (`npm test`) |

**Não sobem para o servidor:** `t/`, `package.json`, `node_modules/`, `emails/`.

## Publicar do zero

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, cole e execute o `supabase.sql` inteiro, de uma vez.
3. Em **Project Settings → API**, copie a *Project URL* e a *Publishable key*.
   Nunca use a `service_role`.
4. Copie `config.example.js` para `config.js` e preencha os dois valores.
5. Em **Authentication → URL Configuration**:
   - Site URL: `https://www.radarrider.com`
   - Redirect URLs: `https://www.radarrider.com/**`
6. Configure o SMTP e os templates de e-mail seguindo
   [`emails/COMO-CONFIGURAR.md`](emails/COMO-CONFIGURAR.md).
7. Suba os arquivos para o `public_html` da Hostinger.
8. Confirme que o site abre em **HTTPS** — sem isso o GPS e a instalação do PWA
   não funcionam.
9. Faça o seu cadastro no site.
10. Vire admin, rodando no SQL Editor com o seu e-mail:
    ```sql
    update public.profiles set role='admin'
    where id=(select id from auth.users where email='SEU_EMAIL');
    ```
11. Em **Database → Cron**, agende a faxina dos alertas vencidos:
    ```sql
    select cron.schedule('expirar-alertas','*/10 * * * *',$$select public.auto_expire_alerts()$$);
    ```

## Publicar uma alteração

1. `npm test` — tem que passar tudo.
2. Suba o número do cache em `service-worker.js` (`radar-rider-vX.Y.Z`).
   **Se esquecer, quem já instalou continua com a versão velha.**
3. Copie os arquivos alterados para o `public_html`.

## Testar

```bash
npm install   # só na primeira vez
npm test
```

`t/check-ids.mjs` confere que todo id usado no JS existe no HTML.
`t/smoke.mjs` sobe o app num DOM de mentira e testa navegação, fluxo de
reportar, modais e a detecção de país pelas coordenadas.

## Decisões que parecem estranhas e são de propósito

- **A coordenada exata nunca sai pela API.** O banco só entrega
  `latitude_public`/`longitude_public`, arredondadas para ~100 m. A posição real
  fica gravada e só é acessível por função auditável, para moderação.
- **`alerts.user_id` também não sai pela API.** É o que mantém o alerta anônimo.
  Por isso "meus alertas" vem da função `my_alerts()` e não de um filtro no
  cliente.
- **Quem é staff é `profiles.role`, não uma coluna `is_admin`.** Toda a RLS lê
  `is_staff()`. Uma segunda coluna criaria duas fontes de verdade discordando.
- **Ocultar um alerta é melhor que apagar.** Ocultar tira do app, mantém o
  registro e é reversível. Apagar leva as confirmações junto.
- **O prazo de expiração é o que o autor escolheu** (1h a 12h, teto de 24h no
  banco), não um prazo fixo para todos.
- **Sem verificação de identidade.** O produto não pede documento de ninguém.

## Limites conhecidos

- O país (IE/GB) vem de uma caixa de coordenadas com um contorno aproximado da
  Irlanda do Norte. Serve para agrupar no painel e escolher km/milhas —
  não vale como jurisdição.
- Os tiles do mapa são do CARTO (tema escuro) sobre dados do OpenStreetMap, na
  camada pública gratuita. Para volume de verdade, contrate um plano — a
  atribuição no rodapé do mapa é obrigatória e não pode ser removida.
- Excluir a conta abre uma solicitação; a remoção final em `auth.users` é feita
  à mão pelo painel do Supabase.
