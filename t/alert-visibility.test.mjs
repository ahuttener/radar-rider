import test from 'node:test';
import assert from 'node:assert/strict';
import { toPublicAlert } from '../src/lib/alert-visibility.ts';

test('resposta pública nunca inclui autor nem coordenada exata', () => {
  const full = {
    id: 'alerta-1',
    userId: 'usuario-secreto',
    category: 'roubo',
    description: 'Risco de roubo na área',
    occurredAt: new Date(),
    isOngoing: true,
    latitudePrivate: 53.349812,
    longitudePrivate: -6.260312,
    latitudePublic: 53.35,
    longitudePublic: -6.26,
    status: 'active',
    countryCode: 'IE',
    confirmationsCount: 2,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  };

  const publicAlert = toPublicAlert(full);
  assert.equal('userId' in publicAlert, false);
  assert.equal('latitudePrivate' in publicAlert, false);
  assert.equal('longitudePrivate' in publicAlert, false);
  assert.equal(publicAlert.latitudePublic, 53.35);
});
