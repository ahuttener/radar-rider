# E-mails do Radar Rider

Quem envia o e-mail de confirmação de conta e o de recuperação de senha é o
**Supabase**, não o site. Então não existe código de envio no repositório: o que
existe são os dois templates ao lado deste arquivo, que você cola no painel.

Sem os dois passos abaixo, o e-mail sai do endereço genérico do Supabase, com
visual padrão e sem a logo.

---

## 1. Fazer o e-mail sair de contato@radarrider.com

O remetente só muda se você configurar um SMTP próprio. O Supabase manda o
e-mail pelo servidor que você indicar aqui.

**Antes:** crie a caixa `contato@radarrider.com` no painel da Hostinger
(Emails → Contas de e-mail) e guarde a senha dela.

No Supabase: **Project Settings → Authentication → SMTP Settings** → ligue
*Enable Custom SMTP* e preencha:

| Campo | Valor |
|---|---|
| Sender email | `contato@radarrider.com` |
| Sender name | `Radar Rider` |
| Host | `smtp.hostinger.com` |
| Port | `465` |
| Username | `contato@radarrider.com` |
| Password | a senha da caixa de e-mail |

> A senha do e-mail fica **só** no painel do Supabase. Nunca no `config.js`,
> nunca neste repositório.

Se cair na porta 465 e não funcionar, tente `587`. As duas servem; 465 é SSL
direto e 587 é STARTTLS.

---

## 2. Colar os templates

No Supabase: **Authentication → Emails** (aba *Templates*).

| Template do painel | Arquivo daqui |
|---|---|
| Confirm signup | `confirmacao-de-conta.html` |
| Reset password | `recuperacao-de-senha.html` |

Abra o arquivo, copie **todo** o conteúdo e cole no campo do painel. Ajuste os
assuntos para:

- Confirm signup → `Confirme sua conta no Radar Rider`
- Reset password → `Redefinir sua senha do Radar Rider`

---

## 3. Fazer a logo aparecer

Os dois templates buscam a logo em:

```
https://www.radarrider.com/icon-512.png
```

Cliente de e-mail não abre caminho relativo, por isso o endereço é absoluto.
Isso significa que **o site precisa estar no ar antes do primeiro cadastro** —
se o domínio ainda não responde, chega um quadrado vazio no lugar da logo.

Para conferir: abra esse endereço direto no navegador, numa aba anônima. Se a
logo aparecer, o e-mail vai mostrar ela também.

---

## 4. Onde a URL de retorno é decidida

Em **Authentication → URL Configuration**:

- Site URL: `https://www.radarrider.com`
- Redirect URLs: `https://www.radarrider.com/**`

Se o seu domínio responder tanto com `www` quanto sem, cadastre os dois nas
Redirect URLs. É o erro mais comum: a pessoa clica no link do e-mail, o
endereço não bate com o cadastrado e o Supabase recusa com
*"requested path is invalid"*.

O `SITE_URL` do `config.js` precisa ser exatamente o mesmo endereço.

---

## 5. Testar de ponta a ponta

1. Crie uma conta com um e-mail seu de verdade.
2. Confira que o e-mail chegou de `contato@radarrider.com`, com a logo.
3. Clique em confirmar e veja se cai no site logado.
4. Saia da conta, clique em **Esqueci minha senha**.
5. Clique no link do e-mail: o app tem que abrir **direto o formulário de nova
   senha** (é o evento `PASSWORD_RECOVERY` tratado no `app.js`).
6. Troque a senha e entre com ela.

Se o passo 5 abrir o site normal, sem o formulário, o `app.js` no servidor está
desatualizado.
