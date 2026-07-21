import test from 'node:test';
import assert from 'node:assert/strict';
import { countryFromCoords, publicCoord, distanceMetres, isValidCoord } from '../src/lib/geo.ts';

test('separa Irlanda de Reino Unido pelas coordenadas', () => {
  const casos = [
    ['Dublin', 53.3498, -6.2603, 'IE'],
    ['Cork', 51.8985, -8.4756, 'IE'],
    ['Galway', 53.2707, -9.0568, 'IE'],
    // A fronteira e o caso dificil: Donegal e Republica, mas fica ao norte
    // de Belfast. Uma caixa simples de latitude erraria os dois.
    ['Letterkenny (Donegal)', 54.9503, -7.7345, 'IE'],
    ['Belfast', 54.5973, -5.9301, 'GB'],
    ['Derry', 54.9966, -7.3086, 'GB'],
    ['Londres', 51.5074, -0.1278, 'GB'],
    ['Manchester', 53.4808, -2.2426, 'GB'],
    ['Edimburgo', 55.9533, -3.1883, 'GB'],
  ];
  for (const [nome, lat, lng, esperado] of casos) {
    assert.equal(countryFromCoords(lat, lng), esperado, `${nome} deveria ser ${esperado}`);
  }
});

test('coordenada publica borra a posicao para cerca de 100 metros', () => {
  const lat = 53.349812345;
  const lng = -6.260312345;
  const borradoLat = publicCoord(lat);
  const borradoLng = publicCoord(lng);

  assert.equal(borradoLat, 53.35);
  assert.equal(borradoLng, -6.26);

  // O que importa nao e o numero: e o alerta nao apontar para uma porta.
  const desvio = distanceMetres({ lat, lng }, { lat: borradoLat, lng: borradoLng });
  assert.ok(desvio > 10, `deveria deslocar o ponto, deslocou ${desvio.toFixed(1)} m`);
  assert.ok(desvio < 150, `deslocou demais: ${desvio.toFixed(1)} m`);
});

test('borrar e idempotente: reaplicar nao move mais o ponto', () => {
  const uma = publicCoord(53.349812345);
  assert.equal(publicCoord(uma), uma);
});

test('distancia bate com a realidade', () => {
  // O'Connell Bridge ate a Christ Church Cathedral, ~1 km andando.
  const d = distanceMetres({ lat: 53.3473, lng: -6.2591 }, { lat: 53.3434, lng: -6.2711 });
  assert.ok(d > 700 && d < 1200, `esperava ~900 m, deu ${d.toFixed(0)} m`);
});

test('recusa coordenada invalida', () => {
  assert.equal(isValidCoord(91, 0), false);
  assert.equal(isValidCoord(0, 181), false);
  assert.equal(isValidCoord(NaN, 0), false);
  assert.equal(isValidCoord('53.3', -6.2), false);
  assert.equal(isValidCoord(53.3, -6.2), true);
});
