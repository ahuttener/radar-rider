import test from 'node:test';
import assert from 'node:assert/strict';
import { sessaoRevogada } from '../src/lib/sessao.ts';

// Este teste existe por causa de um buraco medido no ar: uma conta banida
// continuava publicando alerta com o cookie antigo (HTTP 201 DEPOIS do
// banimento). O login recusava, o banco tinha o `bannedAt` gravado, e mesmo
// assim a sessao valia por ate 30 dias. Punir sem derrubar a sessao e o mesmo
// que nao punir.

const AGORA = Date.parse('2026-08-08T12:00:00Z');
const EMITIDO = AGORA - 60 * 60 * 1000; // token de uma hora atras

function conta(campos = {}) {
  return {
    deletedAt: null,
    bannedAt: null,
    suspendedUntil: null,
    passwordChangedAt: null,
    ...campos,
  };
}

test('conta em ordem mantem a sessao', () => {
  assert.equal(sessaoRevogada(conta(), EMITIDO, AGORA), false);
});

test('conta que sumiu do banco derruba a sessao', () => {
  assert.equal(sessaoRevogada(null, EMITIDO, AGORA), true);
});

test('conta excluida derruba a sessao', () => {
  assert.equal(sessaoRevogada(conta({ deletedAt: new Date(AGORA) }), EMITIDO, AGORA), true);
});

test('BANIMENTO derruba a sessao ja aberta', () => {
  assert.equal(sessaoRevogada(conta({ bannedAt: new Date(AGORA) }), EMITIDO, AGORA), true);
});

test('SUSPENSAO em vigor derruba a sessao ja aberta', () => {
  const daquiUmaSemana = new Date(AGORA + 7 * 24 * 60 * 60 * 1000);
  assert.equal(sessaoRevogada(conta({ suspendedUntil: daquiUmaSemana }), EMITIDO, AGORA), true);
});

test('suspensao ja vencida NAO derruba a sessao', () => {
  const ontem = new Date(AGORA - 24 * 60 * 60 * 1000);
  assert.equal(sessaoRevogada(conta({ suspendedUntil: ontem }), EMITIDO, AGORA), false);
});

test('token emitido ANTES da troca de senha morre', () => {
  const trocou = new Date(AGORA - 30 * 60 * 1000); // meia hora atras, depois do token
  assert.equal(sessaoRevogada(conta({ passwordChangedAt: trocou }), EMITIDO, AGORA), true);
});

test('token emitido DEPOIS da troca de senha sobrevive', () => {
  const trocou = new Date(EMITIDO - 1000);
  assert.equal(sessaoRevogada(conta({ passwordChangedAt: trocou }), EMITIDO, AGORA), false);
});

test('token sem iat (emitidoEm = 0) morre se houve troca de senha', () => {
  const trocou = new Date(AGORA - 24 * 60 * 60 * 1000);
  assert.equal(sessaoRevogada(conta({ passwordChangedAt: trocou }), 0, AGORA), true);
});
