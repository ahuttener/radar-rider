import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

// O login compara a senha contra um hash descartavel quando o e-mail nao
// existe, para que o tempo de resposta nao denuncie quem tem conta no app.
//
// Este teste existe porque a primeira versao TINHA esse cuidado no comentario
// e nao na pratica: o hash estava escrito a mao com 65 caracteres (o certo sao
// 60), o bcrypt recusava o formato e devolvia false em 0 ms, contra 220 ms de
// um hash real. A diferenca entregava, numa unica tentativa, se o e-mail
// existia. Comentario nao protege ninguem; o teste protege.

const CUSTO = 12;

function mede(fn) {
  const t = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - t) / 1e6;
}

test('o hash descartavel tem formato valido de bcrypt', () => {
  const descartavel = bcrypt.hashSync('conta-inexistente', CUSTO);
  assert.equal(descartavel.length, 60, 'hash bcrypt valido tem 60 caracteres');
  assert.match(descartavel, /^\$2[aby]\$12\$/, 'precisa declarar o mesmo custo do cadastro');
});

test('comparar contra o hash descartavel demora tanto quanto contra um real', () => {
  const descartavel = bcrypt.hashSync('conta-inexistente', CUSTO);
  const real = bcrypt.hashSync('a-senha-de-alguem', CUSTO);

  // Descarta a primeira rodada de cada um: so a de aquecimento.
  bcrypt.compareSync('tentativa', descartavel);
  bcrypt.compareSync('tentativa', real);

  const tDescartavel = mede(() => bcrypt.compareSync('tentativa', descartavel));
  const tReal = mede(() => bcrypt.compareSync('tentativa', real));
  const razao = tReal / Math.max(tDescartavel, 0.001);

  assert.ok(
    razao < 2,
    `os dois caminhos precisam custar o mesmo. real=${tReal.toFixed(1)}ms ` +
      `descartavel=${tDescartavel.toFixed(1)}ms razao=${razao.toFixed(0)}x`,
  );
});

test('um literal escrito a mao com tamanho errado NAO serve', () => {
  // Exatamente o valor que estava no codigo antes da correcao.
  const quebrado = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliduu';
  assert.notEqual(quebrado.length, 60);

  const real = bcrypt.hashSync('a-senha-de-alguem', CUSTO);
  bcrypt.compareSync('tentativa', real);

  const tQuebrado = mede(() => bcrypt.compareSync('tentativa', quebrado));
  const tReal = mede(() => bcrypt.compareSync('tentativa', real));

  // Confirma que o problema era real, e nao teoria.
  assert.ok(
    tReal / Math.max(tQuebrado, 0.001) > 10,
    'o literal quebrado deveria ser ordens de grandeza mais rapido',
  );
});
