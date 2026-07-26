# E-mails do Radar Rider

O site envia os próprios e-mails. Não há Supabase, não há painel externo, não há
template para colar em lugar nenhum.

> **Esta página já disse o contrário.** Até a migração para Next.js + Prisma,
> quem enviava era o Supabase e o texto aqui mandava colar os dois `.html` ao
> lado num painel. Aquilo não vale mais — seguir o texto antigo levava a um
> painel que não faz mais parte da arquitetura.

São dois e-mails, os dois disparados pelo próprio app:

| Quando | Quem dispara | Assunto |
|---|---|---|
| Alguém cria uma conta | `POST /api/register` | Confirme sua conta no Radar Rider |
| Alguém pede nova senha | `POST /api/password/forgot` | Redefinir sua senha do Radar Rider |

O HTML dos dois é montado em **`src/lib/mailer.ts`**, na função `layout()`. É lá
que se mexe no visual — não nos arquivos `.html` desta pasta (veja o fim).

---

## 1. Criar a caixa de e-mail

No hPanel da Hostinger: **Emails → Contas de e-mail** → criar
`contato@radarrider.com`. Guarde a senha; ela vai ser usada no passo 2 e em
nenhum outro lugar.

## 2. Cadastrar as variáveis

Em **Sites → radarrider.com → Variáveis de ambiente**, cadastre:

| Variável | Valor |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `contato@radarrider.com` |
| `SMTP_PASS` | a senha real da caixa (nunca o texto de exemplo do `.env.example`) |
| `MAIL_FROM` | `Radar Rider <contato@radarrider.com>` |

**Reinicie a aplicação depois de cadastrar.** Variável nova só passa a existir
no processo seguinte.

Se a 465 não conectar, tente `587`. As duas servem: 465 é SSL direto, 587 é
STARTTLS. O código escolhe o modo sozinho pelo número da porta.

> Sem essas variáveis o app **não quebra** — ele continua criando contas, só não
> manda o e-mail, e registra `[mailer] SMTP não configurado` no log. Credencial
> incorreta ou servidor indisponível também não derrubam a requisição: o log
> registra somente o código seguro da falha SMTP, sem endereço ou senha. Em
> desenvolvimento o link de confirmação aparece no console, o que dá para testar
> o fluxo inteiro sem SMTP nenhum.

## 3. A logo

Os dois e-mails buscam a logo em `https://www.radarrider.com/icon-512.png`,
endereço absoluto montado a partir de `NEXTAUTH_URL`. Cliente de e-mail não abre
caminho relativo.

Consequência: **o site precisa estar no ar antes do primeiro cadastro.** Se o
domínio ainda não responde, chega um quadrado vazio no lugar da logo. Para
conferir, abra esse endereço numa aba anônima — se a logo aparecer ali, aparece
no e-mail.

## 4. Para onde o link do e-mail aponta

Também sai de `NEXTAUTH_URL`, então ele precisa bater **exatamente** com o
endereço que o navegador usa, `www` incluído. Se o site responde nos dois
(`radarrider.com` e `www.radarrider.com`), escolha um e mantenha. Endereço
divergente é a causa mais comum de link de e-mail que abre a página errada.

O de confirmação cai em `/confirmar?token=…`, o de senha em `/nova-senha?token=…`.
Os dois tokens valem **1 hora** e só podem ser usados uma vez.

## 5. Testar de ponta a ponta

1. Crie uma conta com um e-mail seu de verdade.
2. Confira que chegou de `contato@radarrider.com`, com a logo.
3. Clique em confirmar — tem que cair no site já podendo entrar.
4. Saia, clique em **Esqueci minha senha**.
5. O link tem que abrir direto o formulário de nova senha.
6. Troque a senha e entre com ela.
7. Clique no mesmo link de novo: tem que recusar, porque o token já foi usado.

O passo 7 é o que costuma passar batido, e é o que garante que um link vazado da
caixa de e-mail de alguém não vira uma porta aberta.

---

## Os arquivos `.html` desta pasta

`confirmacao-de-conta.html` e `recuperacao-de-senha.html` são a **pré-visualização**
do que o `mailer.ts` gera. Servem para abrir no navegador e ver como o e-mail
fica sem precisar disparar um envio.

Eles **não são lidos pelo app**. Mexer neles não muda o e-mail que sai — para
isso, edite `layout()` em `src/lib/mailer.ts`.
