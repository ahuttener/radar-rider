export const LEGAL_UPDATED = '22 de julho de 2026';
export const PRIVACY_EMAIL = process.env.PRIVACY_EMAIL || 'contato@radarrider.com';

export function legalIdentity() {
  const name = process.env.LEGAL_CONTROLLER_NAME?.trim();
  const address = process.env.LEGAL_CONTROLLER_ADDRESS?.trim();
  return {
    name: name || 'Responsável individual pelo Radar Rider',
    address: address || 'Irlanda — endereço postal ainda não configurado',
    incomplete: !name || !address,
  };
}
