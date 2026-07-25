// Data única de atualização dos documentos legais, nos dois idiomas. Antes o
// texto em inglês trazia a data escrita à mão em cada página, o que já tinha
// dessincronizado de um dia — mudar num lugar não mudava no outro.
export const LEGAL_UPDATED = '25 de julho de 2026';
export const LEGAL_UPDATED_EN = 'July 25, 2026';
export const PRIVACY_EMAIL = process.env.PRIVACY_EMAIL || 'contato@radarrider.com';

export function legalIdentity() {
  const name = process.env.LEGAL_CONTROLLER_NAME?.trim();
  // Endereço postal é OPCIONAL. O RGPD (Art. 13) exige identidade + dados de
  // contato do controlador; um e-mail monitorado cumpre isso. Só entra na
  // política se estiver configurado — o responsável não é obrigado a expor
  // endereço residencial. O contato oficial é o PRIVACY_EMAIL.
  const address = process.env.LEGAL_CONTROLLER_ADDRESS?.trim() || null;
  return {
    name: name || 'Responsável individual pelo Radar Rider',
    address,
    // Só o nome é obrigatório para deixar a identidade completa.
    incomplete: !name,
  };
}
