import test from 'node:test';
import assert from 'node:assert/strict';
import { smtpConfigurado } from '../src/lib/mailer.ts';

const CHAVES = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

function comEnv(valores, fn) {
  const antes = {};
  for (const k of CHAVES) antes[k] = process.env[k];
  try {
    for (const k of CHAVES) {
      if (valores[k] === undefined) delete process.env[k];
      else process.env[k] = valores[k];
    }
    fn();
  } finally {
    for (const k of CHAVES) {
      if (antes[k] === undefined) delete process.env[k];
      else process.env[k] = antes[k];
    }
  }
}

test('sem nenhuma variavel de SMTP, nao esta configurado', () => {
  comEnv({}, () => assert.equal(smtpConfigurado(), false));
});

test('com host, usuario e senha, esta configurado', () => {
  comEnv(
    { SMTP_HOST: 'smtp.hostinger.com', SMTP_USER: 'contato@radarrider.com', SMTP_PASS: 'x'.repeat(10) },
    () => assert.equal(smtpConfigurado(), true),
  );
});

// Este e o caso que motivou a funcao: configuracao PELA METADE. Antes, o
// cadastro criava a conta, o envio falhava e a pessoa ficava sem poder entrar
// sem nenhum aviso. Faltando qualquer uma das tres, tem de dar false.
test('configuracao pela metade conta como NAO configurado', () => {
  comEnv({ SMTP_HOST: 'smtp.hostinger.com', SMTP_USER: 'contato@radarrider.com' }, () =>
    assert.equal(smtpConfigurado(), false, 'sem SMTP_PASS deveria ser false'),
  );
  comEnv({ SMTP_HOST: 'smtp.hostinger.com', SMTP_PASS: 'segredo' }, () =>
    assert.equal(smtpConfigurado(), false, 'sem SMTP_USER deveria ser false'),
  );
  comEnv({ SMTP_USER: 'contato@radarrider.com', SMTP_PASS: 'segredo' }, () =>
    assert.equal(smtpConfigurado(), false, 'sem SMTP_HOST deveria ser false'),
  );
});

test('variavel vazia nao conta como configurada', () => {
  comEnv({ SMTP_HOST: 'smtp.hostinger.com', SMTP_USER: 'contato@radarrider.com', SMTP_PASS: '' }, () =>
    assert.equal(smtpConfigurado(), false),
  );
});
