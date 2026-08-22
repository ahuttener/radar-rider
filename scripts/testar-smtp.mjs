/**
 * Testa a configuracao de SMTP do Radar Rider de ponta a ponta.
 *
 * Uso:
 *   node scripts/testar-smtp.mjs                      -> so verifica conexao e autenticacao
 *   node scripts/testar-smtp.mjs voce@exemplo.com      -> tambem manda um e-mail de teste
 *
 * Le as variaveis de process.env e, se nao existirem ali, de .env.local e .env.
 * Nao imprime a senha. Nao grava nada.
 *
 * Existe porque "a configuracao parece certa" nao e resposta: aqui a resposta e
 * "autenticou" ou "falhou com este erro".
 */
import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const PLACEHOLDER = 'a-senha-da-caixa-de-email';

/** Le um .env simples sem dependencia externa. Nao sobrescreve o que ja veio do ambiente. */
function carregarEnv(arquivo) {
  const caminho = path.join(RAIZ, arquivo);
  if (!existsSync(caminho)) return false;
  const linhas = readFileSync(caminho, 'utf8').split(/\r?\n/);
  for (const linha of linhas) {
    const corte = linha.indexOf('=');
    if (!linha || linha.trimStart().startsWith('#') || corte < 0) continue;
    const chave = linha.slice(0, corte).trim();
    if (process.env[chave] !== undefined) continue;
    let valor = linha.slice(corte + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    process.env[chave] = valor;
  }
  return true;
}

const arquivosLidos = ['.env.local', '.env'].filter(carregarEnv);

const host = process.env.SMTP_HOST;
const porta = Number(process.env.SMTP_PORT) || 465;
const usuario = process.env.SMTP_USER;
const senha = process.env.SMTP_PASS;
const remetente = process.env.MAIL_FROM || 'Radar Rider <contato@radarrider.com>';
const destino = process.argv[2] || process.env.SMTP_TEST_TO || null;

// `secure` tem de espelhar exatamente o que src/lib/mailer.ts faz, senao o teste
// valida uma configuracao diferente da que o site usa.
const secure = porta === 465;

console.log('=== Configuracao lida ===');
console.log(`  arquivos de ambiente : ${arquivosLidos.length ? arquivosLidos.join(', ') : 'nenhum (usando so process.env)'}`);
console.log(`  SMTP_HOST            : ${host ?? '(ausente)'}`);
console.log(`  SMTP_PORT            : ${porta}  ->  secure=${secure} (${secure ? 'SSL direto' : 'STARTTLS'})`);
console.log(`  SMTP_USER            : ${usuario ?? '(ausente)'}`);
console.log(`  SMTP_PASS            : ${senha ? `<${senha.length} caracteres>` : '(ausente)'}`);
console.log(`  MAIL_FROM            : ${remetente}`);
console.log(`  destino do teste     : ${destino ?? '(nenhum, so vou verificar a autenticacao)'}`);
console.log('');

const problemas = [];
if (!host) problemas.push('SMTP_HOST nao esta definido.');
if (!usuario) problemas.push('SMTP_USER nao esta definido.');
if (!senha) problemas.push('SMTP_PASS nao esta definido.');
if (senha === PLACEHOLDER) {
  problemas.push(
    `SMTP_PASS ainda e o texto de exemplo ("${PLACEHOLDER}"), nao uma senha. ` +
      'Troque pela senha real da caixa, criada no hPanel em Emails > Contas de e-mail.',
  );
}
if (porta !== 465 && porta !== 587) {
  problemas.push(`SMTP_PORT=${porta} nao e 465 nem 587. A Hostinger atende 465 (SSL) e 587 (STARTTLS).`);
}
if (remetente && usuario && !remetente.includes(usuario)) {
  // Nao e erro fatal, mas quase todo servidor recusa enviar em nome de outro endereco.
  console.warn(
    `AVISO: MAIL_FROM (${remetente}) nao contem o endereco de SMTP_USER (${usuario}). ` +
      'A maioria dos servidores recusa isso com "sender address rejected".\n',
  );
}

if (problemas.length) {
  console.error('=== Nao da para testar ainda ===');
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}

/** Traduz os erros que realmente aparecem nesse cenario. */
function explicar(erro) {
  const codigo = erro?.code || erro?.responseCode || '';
  const texto = String(erro?.message || erro);
  if (codigo === 'EAUTH' || /535|534|password|authentication/i.test(texto)) {
    return 'Usuario ou senha recusados. Confirme a senha da caixa no hPanel; se tiver esquecido, redefina por lá. O usuario tem de ser o endereco completo (contato@radarrider.com), nao apenas "contato".';
  }
  if (codigo === 'ETIMEDOUT' || codigo === 'ECONNREFUSED' || /timeout|refused/i.test(texto)) {
    return `Nao consegui abrir conexao em ${host}:${porta}. Costuma ser a porta bloqueada pela rede/provedor, ou porta trocada: 465 exige SSL direto e 587 exige STARTTLS. Tente a outra.`;
  }
  if (codigo === 'ESOCKET' || /wrong version number|SSL|TLS/i.test(texto)) {
    return `Erro de TLS. Isso acontece quando a porta e o modo nao combinam: porta 465 precisa de secure=true e 587 de secure=false. Aqui foi usado secure=${secure} para a porta ${porta}.`;
  }
  if (codigo === 'EDNS' || /ENOTFOUND|getaddrinfo/i.test(texto)) {
    return `O endereco "${host}" nao resolveu no DNS. Confira se nao ha erro de digitacao.`;
  }
  if (/sender address rejected|not allowed|relay/i.test(texto)) {
    return `O servidor recusou o remetente. O endereco dentro de MAIL_FROM precisa ser a mesma caixa autenticada (${usuario}).`;
  }
  return null;
}

const transporte = nodemailer.createTransport({
  host,
  port: porta,
  secure,
  auth: { user: usuario, pass: senha },
});

try {
  console.log('=== 1) Conexao e autenticacao ===');
  await transporte.verify();
  console.log('  OK: o servidor aceitou a conexao e as credenciais.\n');
} catch (erro) {
  console.error('  FALHOU.');
  const dica = explicar(erro);
  if (dica) console.error(`  Provavel causa: ${dica}`);
  console.error(`  Erro bruto: ${erro?.code ?? ''} ${erro?.message ?? erro}`);
  process.exit(1);
}

if (!destino) {
  console.log('Autenticacao validada. Para mandar um e-mail de verdade:');
  console.log('  node scripts/testar-smtp.mjs seu-email@exemplo.com');
  process.exit(0);
}

// A logo vai embutida por `cid`, igual ao mailer de producao: Outlook e Hotmail
// bloqueiam imagem remota de remetente desconhecido. Se o arquivo nao existir, o
// e-mail sai sem ela em vez de quebrar - mas eu aviso, porque no site a logo
// tambem sumiria.
const caminhoLogo = path.join(RAIZ, 'public', 'icon-192.png');
let logo = null;
if (existsSync(caminhoLogo)) {
  logo = readFileSync(caminhoLogo);
  console.log(`=== 2) Logo ===\n  encontrada: public/icon-192.png (${(logo.length / 1024).toFixed(1)} KB)\n`);
} else {
  console.warn('=== 2) Logo ===\n  AVISO: public/icon-192.png nao existe. O e-mail do site cairia no endereco de reserva.\n');
}

try {
  console.log('=== 3) Envio ===');
  const info = await transporte.sendMail({
    from: remetente,
    to: destino,
    subject: 'Radar Rider — teste de SMTP',
    text:
      'Se você está lendo isto, o SMTP do Radar Rider está funcionando: conexão, ' +
      'autenticação e envio.\n\nEste e-mail foi gerado por scripts/testar-smtp.mjs.',
    html: `<div style="background:#050805;padding:28px 0;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="600" style="width:600px;max-width:92%;margin:0 auto;background:#0b120d;border:1px solid #1e3325;border-radius:18px;overflow:hidden">
    <tr><td align="center" style="padding:34px 40px 6px">
      ${logo ? '<img src="cid:logo-radar-rider" alt="Radar Rider" width="120" height="120" style="width:120px;height:120px;border:0;display:inline-block;border-radius:20px"/>' : ''}
    </td></tr>
    <tr><td align="center" style="padding:14px 44px 0">
      <h1 style="color:#eafbe9;font-size:20px;margin:0 0 10px">SMTP funcionando</h1>
      <p style="color:#a9c4ad;font-size:14px;line-height:22px;margin:0 0 6px">
        Conexão, autenticação e envio deram certo.
      </p>
      <p style="color:#6f8a74;font-size:12px;line-height:20px;margin:18px 0 30px">
        Servidor ${host}:${porta} · remetente ${remetente}<br/>
        Se a imagem acima apareceu, a logo embutida por <code>cid</code> também está certa.
      </p>
    </td></tr>
  </table>
</div>`,
    attachments: logo
      ? [
          {
            filename: 'radar-rider.png',
            content: logo,
            cid: 'logo-radar-rider',
            contentType: 'image/png',
            contentDisposition: 'inline',
          },
        ]
      : undefined,
  });
  console.log(`  OK: aceito pelo servidor.`);
  console.log(`  messageId : ${info.messageId}`);
  console.log(`  resposta  : ${String(info.response || '').trim()}`);
  if (info.rejected?.length) console.warn(`  RECUSADOS : ${info.rejected.join(', ')}`);
  console.log('');
  console.log(`Confira a caixa de ${destino}. Se nao chegar em alguns minutos, veja o SPAM:`);
  console.log('aceito pelo servidor nao garante entrega na caixa de entrada (SPF/DKIM/DMARC).');
} catch (erro) {
  console.error('  FALHOU.');
  const dica = explicar(erro);
  if (dica) console.error(`  Provavel causa: ${dica}`);
  console.error(`  Erro bruto: ${erro?.code ?? ''} ${erro?.message ?? erro}`);
  process.exit(1);
}
