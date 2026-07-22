import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Envio de e-mail pelo SMTP da Hostinger (contato@radarrider.com).
// O layout segue o mesmo padrão do Keymate: tabela de 600px com estilo inline,
// porque Gmail e Outlook descartam <style> no topo e não entendem flex/grid.

const SITE = process.env.NEXTAUTH_URL || 'https://www.radarrider.com';

// LOGO EMBUTIDA, NÃO LINKADA.
//
// A versão anterior apontava para https://www.radarrider.com/icon-512.png. O
// endereço funciona — 200 pelo CDN, testado — e mesmo assim a logo não chegava:
// Outlook e Hotmail BLOQUEIAM imagem remota de remetente desconhecido por
// padrão, e o que aparece é um quadrado vazio até a pessoa clicar em "baixar
// imagens". Num e-mail de confirmação de conta, que é o primeiro contato da
// pessoa com a marca, isso é justamente onde a logo mais importa.
//
// Embutida como anexo `cid`, ela viaja dentro da mensagem: não depende de o
// site estar no ar (e este aqui cai), não depende de permissão de imagem
// remota, e não entrega ao servidor de e-mail um sinal de rastreamento.
//
// Usa o ícone de 192 e não o de 512: são 38 kB contra 155 kB, e o e-mail
// mostra a logo com 120 px de largura de qualquer jeito.
const LOGO_CID = 'logo-radar-rider';
const LOGO_URL_RESERVA = `${SITE}/icon-192.png`;

let logoEmMemoria: Buffer | null | undefined;

/** Lê o PNG uma vez só e guarda. `null` quando o arquivo não está acessível. */
function logoAnexo(): Buffer | null {
  if (logoEmMemoria !== undefined) return logoEmMemoria;
  try {
    logoEmMemoria = readFileSync(path.join(process.cwd(), 'public', 'icon-192.png'));
  } catch (e) {
    // Sem o arquivo o e-mail ainda sai, só volta a depender da URL remota.
    // Perder a logo nunca pode custar a confirmação da conta.
    console.warn('[mailer] Logo não encontrada para embutir; usando URL remota.', e);
    logoEmMemoria = null;
  }
  return logoEmMemoria;
}

function transporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 é SSL direto; 587 é STARTTLS
    auth: { user, pass },
  });
}

function layout(opts: {
  titulo: string;
  texto: string;
  botao: string;
  url: string;
  aviso: { cor: 'amarelo' | 'vermelho'; html: string };
  rodape: string;
}) {
  const cores =
    opts.aviso.cor === 'vermelho'
      ? { fundo: 'rgba(255,77,87,.08)', borda: 'rgba(255,77,87,.25)', texto: '#f0a6ab' }
      : { fundo: 'rgba(255,210,26,.07)', borda: 'rgba(255,210,26,.22)', texto: '#e0d194' };

  return `<div style="background:#050805;padding:28px 0;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="600" style="width:600px;max-width:92%;margin:0 auto;background:#0b120d;border:1px solid #1e3325;border-radius:18px;overflow:hidden">
    <tr><td align="center" style="padding:34px 40px 6px">
      <a href="${SITE}" target="_blank" style="text-decoration:none;border:0"><img src="${logoAnexo() ? `cid:${LOGO_CID}` : LOGO_URL_RESERVA}" alt="Radar Rider" width="120" height="120" style="width:120px;height:120px;border:0;display:inline-block;border-radius:20px"/></a>
    </td></tr>
    <tr><td align="center" style="padding:14px 44px 0">
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#F7FBF8">${opts.titulo}</h1>
    </td></tr>
    <tr><td style="padding:14px 46px 4px">
      <p style="margin:0;font-size:15px;line-height:1.65;color:#a9bdb0;text-align:center">${opts.texto}</p>
    </td></tr>
    <tr><td align="center" style="padding:26px 46px 6px">
      <a href="${opts.url}" target="_blank" style="display:inline-block;background:#23F36B;color:#03140a;font-size:15px;font-weight:800;text-decoration:none;padding:15px 34px;border-radius:12px">${opts.botao}</a>
    </td></tr>
    <tr><td style="padding:16px 46px 0">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#7b8f81;text-align:center">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="color:#a9bdb0;word-break:break-all">${opts.url}</span></p>
    </td></tr>
    <tr><td style="padding:22px 46px 0">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${cores.fundo};border:1px solid ${cores.borda};border-radius:12px">
        <tr><td style="padding:13px 16px"><p style="margin:0;font-size:12px;line-height:1.6;color:${cores.texto}">${opts.aviso.html}</p></td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 46px 28px">
      <p style="margin:0;font-size:11.5px;line-height:1.6;color:#6f8375;text-align:center">${opts.rodape}</p>
    </td></tr>
    <tr><td align="center" style="background:#0f1a12;border-top:1px solid #1e3325;padding:15px 44px">
      <span style="color:#23F36B;font-size:12.5px;font-weight:800;letter-spacing:.5px">www.radarrider.com</span>
      <span style="color:#5d6f63;font-size:11px;display:block;margin-top:5px">Em perigo imediato, ligue 999 ou 112. O Radar Rider não substitui os serviços de emergência.</span>
    </td></tr>
  </table>
</div>`;
}

async function enviar(para: string, assunto: string, html: string, texto: string) {
  const tx = transporter();
  if (!tx) {
    // Sem SMTP configurado o app continua de pé; só não manda e-mail. Em
    // desenvolvimento o link aparece no console para dar para testar o fluxo.
    console.warn(`[mailer] SMTP não configurado. E-mail para ${para} não enviado.`);
    if (process.env.NODE_ENV !== 'production') console.info(`[mailer] ${assunto}\n${texto}`);
    return false;
  }
  const logo = logoAnexo();
  await tx.sendMail({
    from: process.env.MAIL_FROM || 'Radar Rider <contato@radarrider.com>',
    to: para,
    subject: assunto,
    text: texto,
    html,
    // `cid` casa com o src do <img> no layout. `contentDisposition: inline`
    // evita que Gmail e Outlook mostrem a logo como anexo pendurado embaixo
    // da mensagem, além de exibi-la no corpo.
    attachments: logo
      ? [{
          filename: 'radar-rider.png',
          content: logo,
          cid: LOGO_CID,
          contentType: 'image/png',
          contentDisposition: 'inline' as const,
        }]
      : undefined,
  });
  return true;
}

export function enviarConfirmacaoDeConta(email: string, url: string) {
  return enviar(
    email,
    'Confirme sua conta no Radar Rider',
    layout({
      titulo: 'Confirme sua conta',
      texto:
        'Falta um passo para você entrar no <b style="color:#23F36B">Radar Rider</b> e receber os alertas de segurança que outros riders publicam perto de você.',
      botao: 'Confirmar minha conta',
      url,
      aviso: {
        cor: 'amarelo',
        html: '🛡️ Ao publicar um alerta, nunca descreva pessoas — só o risco e a área. Sua localização é sempre divulgada de forma aproximada.',
      },
      rodape: `Este e-mail foi enviado para ${email}.<br>Se não foi você que criou a conta, é só ignorar — nada será ativado.`,
    }),
    `Confirme sua conta no Radar Rider abrindo este endereço:\n${url}`,
  );
}

export function enviarRecuperacaoDeSenha(email: string, url: string) {
  return enviar(
    email,
    'Redefinir sua senha do Radar Rider',
    layout({
      titulo: 'Redefinir sua senha',
      texto:
        'Recebemos um pedido para trocar a senha da sua conta no <b style="color:#23F36B">Radar Rider</b>. Toque no botão abaixo para escolher uma nova.',
      botao: 'Criar nova senha',
      url,
      aviso: {
        cor: 'vermelho',
        html: '🔒 <b>Não foi você que pediu?</b> Ignore este e-mail. Sua senha atual continua valendo e ninguém consegue entrar sem abrir este link.',
      },
      rodape: `Este e-mail foi enviado para ${email}.<br>O link vale por 1 hora e só pode ser usado uma vez.`,
    }),
    `Redefina sua senha do Radar Rider abrindo este endereço:\n${url}`,
  );
}
