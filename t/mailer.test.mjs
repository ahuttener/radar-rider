import test from 'node:test';
import assert from 'node:assert/strict';

// Usa uma porta local fechada para simular senha/servidor SMTP inválido sem
// depender de internet nem de uma credencial real.
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '1';
process.env.SMTP_USER = 'contato@radarrider.com';
process.env.SMTP_PASS = 'senha-incorreta-de-teste';
process.env.MAIL_FROM = 'Radar Rider <contato@radarrider.com>';

const { enviarConfirmacaoDeConta } = await import('../src/lib/mailer.ts');

test('falha SMTP não derruba a requisição nem vaza dados no log', async () => {
  const email = 'destinatario-secreto@example.com';
  const senha = process.env.SMTP_PASS;
  const logs = [];
  const consoleErrorOriginal = console.error;
  console.error = (...args) => logs.push(args.map(String).join(' '));

  try {
    const enviado = await enviarConfirmacaoDeConta(
      email,
      'https://www.radarrider.com/confirmar?token=token-de-teste',
    );

    assert.equal(enviado, false);
    assert.match(logs.join('\n'), /\[mailer\] Falha no envio SMTP \([A-Z0-9_]+\)\./);
    assert.doesNotMatch(logs.join('\n'), new RegExp(email));
    assert.doesNotMatch(logs.join('\n'), new RegExp(senha));
  } finally {
    console.error = consoleErrorOriginal;
  }
});
