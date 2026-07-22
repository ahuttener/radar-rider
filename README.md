# Radar Rider

PWA de segurança comunitária para entregadores na Irlanda e no Reino Unido.
Um entregador publica um alerta de risco; quem está perto vê no mapa e
confirma. A localização é sempre divulgada de forma aproximada.

**Next.js 16 (App Router) + Prisma + MySQL + NextAuth.** Tem build.

> Até meados de 2026 isto era um site estático + Supabase, e este README
> descrevia aquilo: `index.html`, `config.js`, `supabase.sql`, RLS, funções de
> banco. Nada disso existe mais. Se você encontrar instrução mencionando
> Supabase em algum canto do repositório, ela é resíduo — o banco é MySQL e
> quem aplica as regras de acesso é o servidor, não o banco.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/app/` | rotas: páginas e `api/` |
| `src/components/` | `RadarApp` (o app), mapa, modais, seletor de país e documentos legais |
| `src/lib/` | `alert-visibility` (privacidade), `geo`, `auth`, `mailer`, `prisma` |
| `prisma/` | schema e migrações |
| `public/` | manifesto, service worker e ícones do PWA |
| `emails/` | como ligar o SMTP + pré-visualização dos e-mails |
| `app.js` | ponto de entrada na Hostinger — ela inicia por arquivo, não por comando |
| `t/` | testes (`npm test`) |

## Rodar local

```bash
npm install
cp .env.example .env    # e preencha
npx prisma migrate dev
npm run dev
```

Só o `DATABASE_URL` e o `NEXTAUTH_SECRET` são obrigatórios para subir. Sem SMTP
o app **não quebra**: ele deixa de mandar e-mail e escreve o link de confirmação
no console, o que dá para testar o cadastro inteiro sem caixa de e-mail.

Para compilar sem banco nenhum (útil em CI ou para conferir tipos):

```bash
DATABASE_URL="mysql://u:p@127.0.0.1:3306/db" NEXTAUTH_SECRET="x" npx next build
```

O `npm run build` roda `prisma migrate deploy` antes e exige banco de verdade.

## Testar

```bash
npm run check
```

O comando roda testes, ESLint e TypeScript. `t/geo.test.mjs` cobre a separação Irlanda/Reino Unido por coordenada, o borrão
de posição e o cálculo de distância. `t/auth-timing.test.mjs` cobre o hash
descartável do login — a proteção contra descobrir quem tem conta medindo o
tempo da resposta. `t/alert-visibility.test.mjs` garante que autor e coordenada
exata não saem na resposta pública.

## Publicar

Variáveis de ambiente no hPanel (**Sites → radarrider.com → Variáveis de
ambiente**), conforme `.env.example`, e **reiniciar a aplicação** — variável
nova só existe no processo seguinte.

Antes de abrir ao público, configure `LEGAL_CONTROLLER_NAME` e
`LEGAL_CONTROLLER_ADDRESS` com o nome civil e o endereço postal do responsável.
O botão de apoio usa `NEXT_PUBLIC_SUPPORT_URL`.

Ao mexer em `public/service-worker.js`, **suba o número do cache**
(`radar-rider-vX`). Sem isso, quem já instalou continua com os arquivos velhos.

### Armadilhas desta hospedagem

- **`DATABASE_URL` usa `127.0.0.1`, nunca `localhost`.** Com `localhost` o
  driver tenta socket unix em vez de TCP e falha sem dizer o porquê.
- **`experimental.cpus: 1` no `next.config.ts` é obrigatório** para a compilação
  caber nos limites do plano.
- **`app.js` na raiz** é como a Hostinger inicia a aplicação. Não remover.

## Decisões que parecem estranhas e são de propósito

- **A coordenada exata nunca sai numa resposta HTTP.** Toda rota que devolve
  alerta passa por `src/lib/alert-visibility.ts`. No Supabase quem garantia isso
  era a RLS; aqui o Prisma devolve tudo que a linha tem, então a regra virou do
  servidor e mora naquele arquivo. **Não monte objeto de alerta à mão numa rota.**
- **O borrão de posição é feito no servidor, não no cliente.** Se viesse pronto
  do navegador, daria para adulterar o app e publicar um alerta apontando para a
  porta da casa de alguém.
- **O `userId` não sai junto do alerta.** É o que mantém o alerta anônimo; por
  isso "meus alertas" tem rota própria (`/api/alerts/mine`) e não é um filtro no
  cliente.
- **Confirmar exige estar perto** (2 km). De longe não é testemunho, é opinião.
- **O prazo de expiração é o que o autor escolheu** (1 h a 12 h), não um prazo
  fixo para todos.
- **O aviso de cookies não tem botão "recusar".** O app só usa cookie de sessão
  do login, que pela ePrivacy não depende de consentimento. Botão que não
  desliga nada é teatro. Se entrar analytics um dia, aí vira opt-in de verdade.
- **As bandeiras são SVG, não emoji.** O Windows não tem fonte de bandeira e os
  botões apareciam escritos "IE" e "GB" em letra crua.
- **Sem verificação de identidade.** O produto não pede documento de ninguém.

## Limites conhecidos

- O país (IE/GB) vem de uma caixa de coordenadas com um contorno aproximado da
  Irlanda do Norte. Serve para agrupar e escolher km/milhas — não vale como
  jurisdição.
- Os tiles do mapa são do CARTO sobre dados do OpenStreetMap, na camada pública
  gratuita. Para volume de verdade, contrate um plano — a atribuição no rodapé
  do mapa é obrigatória e não pode ser removida.

## O que ainda não existe

Coisas que a versão estática tinha e **não foram portadas** — não são bugs, são
lacunas conhecidas:

- **Upload de imagens e foto de perfil.** O produto atual é propositalmente só
  texto e localização aproximada.
- **Notificações push.** O PWA instala no celular, mas ainda não envia push.
- **Analytics e anúncios.** Não são carregados; se entrarem, exigem novo fluxo
  de consentimento e atualização das políticas.

O painel de moderação fica em `/moderacao` para contas `moderator` ou `admin`.
Exportação e exclusão ficam em “Perfil → Meus dados e direitos”. A rotina de
retenção apaga registros vencidos oportunisticamente, no máximo uma vez por dia
por processo.
