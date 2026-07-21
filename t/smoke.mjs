// Sobe o index.html num DOM de mentira, com Leaflet e Supabase dublados,
// e verifica que o app inicializa e navega sem estourar erro.
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
const html = readFileSync(root + 'index.html', 'utf8')
  .replace(/<script src="https?:[^"]+"><\/script>/g, '')   // sem CDN
  .replace('<script src="config.js"></script>', '')
  .replace('<script src="app.js"></script>', '');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

// 'dangerously' e não 'outside-only': em eval no modo estrito as funções ficam
// presas no escopo do eval, e o teste não enxerga countryFromCoords/goStep.
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://www.radarrider.com/' });
const { window } = dom;

/* ---- dublês ---- */
const chain = () => {
  const o = {};
  for (const m of ['select', 'eq', 'gt', 'order', 'limit', 'insert', 'update', 'maybeSingle', 'single']) o[m] = () => o;
  o.then = (res) => res({ data: [], error: null });
  return o;
};
const leafletObj = () => {
  const o = {};
  for (const m of ['setView', 'addTo', 'bindPopup', 'remove', 'setLatLng', 'invalidateSize', 'removeLayer', 'on', 'subscribe']) o[m] = () => o;
  return o;
};
window.L = {
  map: () => leafletObj(), tileLayer: () => leafletObj(), marker: () => leafletObj(),
  circleMarker: () => leafletObj(), heatLayer: () => leafletObj(),
  control: { zoom: () => leafletObj() }
};
window.supabase = {
  createClient: () => ({
    from: chain, rpc: async () => ({ data: [], error: null }),
    channel: () => leafletObj(),
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => {}, signOut: async () => {},
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null })
    }
  })
};
window.RADAR_CONFIG = {
  SUPABASE_URL: 'https://exemplo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_teste',
  SITE_URL: 'https://www.radarrider.com'
};
window.navigator.geolocation = { getCurrentPosition: (_ok, err) => err({ code: 1 }) };
// Esta versão do jsdom não implementa matchMedia. matches:false simula celular,
// que é onde o app roda de verdade (e onde os botões de zoom ficam escondidos).
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });

/* ---- executa o app ---- */
const tag = window.document.createElement('script');
tag.textContent = readFileSync(root + 'app.js', 'utf8');
window.document.body.appendChild(tag);
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
await new Promise(r => setTimeout(r, 1200));

/* ---- verificações ---- */
const $ = id => window.document.getElementById(id);
const ok = [], fail = [];
const check = (nome, cond) => (cond ? ok : fail).push(nome);

check('boot rodou sem erro no console', errors.length === 0);
check('splash sumiu depois do boot', $('splash').classList.contains('hide'));

// navegação
for (const s of ['alerts', 'report', 'profile', 'map']) {
  window.document.querySelector(`.nav-btn[data-screen="${s}"]`).onclick();
  check(`abre a tela ${s}`, $('screen-' + s).classList.contains('active'));
}

// fluxo de reportar
window.document.querySelector('.nav-btn[data-screen="report"]').onclick();
check('passo 1 comeca com Proximo travado', $('next1').disabled === true);
const opt = window.document.querySelector('.type-opt[data-cat="roubo"]');
opt.onclick();
check('escolher tipo destrava o Proximo', $('next1').disabled === false && opt.classList.contains('sel'));

window.goStep(3);
check('passo 3 mostra o tipo escolhido', $('cfType').textContent.includes('Roubo'));

// convidado ve a chamada de login
window.document.querySelector('.nav-btn[data-screen="profile"]').onclick();
check('visitante ve o convite para entrar', !$('profileGuest').classList.contains('hidden'));

// modal
$('emergencyBtn').onclick();
check('modal de emergencia abre', $('emergencyModal').classList.contains('show'));
window.document.querySelector('[data-close="emergencyModal"]').onclick();
check('modal de emergencia fecha', !$('emergencyModal').classList.contains('show'));

// pais pelas coordenadas
const pais = [
  ['Dublin', 53.3498, -6.2603, 'IE'],
  ['Cork', 51.8985, -8.4756, 'IE'],
  ['Galway', 53.2707, -9.0568, 'IE'],
  ['Letterkenny (Donegal, IE)', 54.9503, -7.7345, 'IE'],
  ['Belfast (NI, UK)', 54.5973, -5.9301, 'GB'],
  ['Derry (NI, UK)', 54.9966, -7.3086, 'GB'],
  ['Londres', 51.5074, -0.1278, 'GB'],
  ['Manchester', 53.4808, -2.2426, 'GB'],
  ['Edimburgo', 55.9533, -3.1883, 'GB']
];
for (const [nome, lat, lng, esperado] of pais) {
  const got = window.countryFromCoords(lat, lng);
  check(`pais de ${nome} = ${esperado}${got === esperado ? '' : ` (deu ${got})`}`, got === esperado);
}

// distancia formatada
check('formata metros em km', window.formatDistance(1500) === '1.5 km');

console.log('\nPASSOU (' + ok.length + '):');
ok.forEach(t => console.log('  ok  ' + t));
if (fail.length) {
  console.log('\nFALHOU (' + fail.length + '):');
  fail.forEach(t => console.log('  XX  ' + t));
}
if (errors.length) { console.log('\nErros capturados:'); errors.forEach(e => console.log('  ' + e)); }
process.exit(fail.length ? 1 : 0);
