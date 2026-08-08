// Regra única de "esta sessão ainda vale?".
//
// A sessão é um JWT de 30 dias sem tabela de sessão (ver src/lib/auth.ts), então
// punir alguém no banco não derruba, sozinho, quem já está logado. O único ponto
// onde dá para matar um token já emitido é o callback `jwt`, que relê a conta a
// cada requisição. Esta função é a decisão desse callback, separada aqui por ser
// testável sem subir next-auth nem o banco.
//
// Existe porque um teste no ar mostrou o buraco: conta banida continuava
// publicando alerta com o cookie antigo (HTTP 201 depois do banimento). O
// `authorize()` do login checa banimento e suspensão; o callback checava só
// exclusão e troca de senha.

export type EstadoDaConta = {
  deletedAt: Date | null;
  bannedAt: Date | null;
  suspendedUntil: Date | null;
  passwordChangedAt: Date | null;
};

/**
 * @param conta estado atual lido do banco, ou null se a conta sumiu
 * @param emitidoEmMs quando o token foi emitido (`iat * 1000`)
 */
export function sessaoRevogada(
  conta: EstadoDaConta | null,
  emitidoEmMs: number,
  agoraMs: number = Date.now(),
): boolean {
  // Conta apagada do banco: não há a quem pertencer.
  if (!conta) return true;
  if (conta.deletedAt) return true;

  // Banimento é permanente; suspensão vale até a data marcada. Passada a data,
  // a pessoa entra de novo pelo login — o token velho já morreu neste caminho.
  if (conta.bannedAt) return true;
  if (conta.suspendedUntil && conta.suspendedUntil.getTime() > agoraMs) return true;

  // Token emitido antes da última troca de senha morre aqui. É o que faz
  // "redefinir a senha" realmente expulsar quem já estava logado.
  if (conta.passwordChangedAt && emitidoEmMs < conta.passwordChangedAt.getTime()) return true;

  return false;
}
