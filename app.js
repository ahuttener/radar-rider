'use strict';
// Radar Rider — app principal.
// Escrito em blocos legíveis (e não em uma linha por função, como na primeira
// versão) porque a tela de reportar virou um fluxo de 3 passos e o mapa passou
// a ter camada de calor: densidade demais custa caro para manter.

const cfg = window.RADAR_CONFIG || {};

let db = null, user = null, profile = null;
let map = null, heatLayer = null, userLocation = null, userMarker = null;
let markers = new Map(), alertsCache = [], myAlerts = [], installPrompt = null;
let authMode = 'login', alertsTab = 'ativos', heatOn = false;
let draft = { category: '', description: '', duration: 180, ongoing: false, occurred: 'agora' };

const $ = id => document.getElementById(id);
const qsa = s => [...document.querySelectorAll(s)];

const CATEGORIES = [
  { id: 'roubo',        icon: '🚨', label: 'Roubo ou tentativa',     severity: 'alta'  },
  { id: 'grupo_hostil', icon: '👥', label: 'Grupo hostil',           severity: 'alta'  },
  { id: 'intimidacao',  icon: '⚠️', label: 'Intimidação ou assédio', severity: 'media' },
  { id: 'acidente',     icon: '⛔', label: 'Acidente ou bloqueio',   severity: 'media' },
  { id: 'via_perigosa', icon: '🛣️', label: 'Via perigosa',           severity: 'baixa' },
  { id: 'outro',        icon: '📍', label: 'Outro risco',            severity: 'baixa' }
];
const catById = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

/* ---------- utilidades ---------- */

function esc(s = '') {
  return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function msg(el, text, type = 'error') {
  el.className = type;
  el.textContent = text || '';
}

let toastTimer = null;
function toast(text, type = 'ok') {
  const t = $('toast');
  t.textContent = text;
  t.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 3200);
}

function configured() {
  return cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('SEU-PROJETO')
      && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('SUA_CHAVE');
}

/* ---------- país e unidade de medida ----------
   Irlanda usa km, Reino Unido usa milhas. O país do ALERTA vem das coordenadas
   (serve para agrupar no painel); a unidade que a pessoa vê segue o aparelho
   dela. As duas coisas são aproximações de conveniência e nenhuma decisão de
   segurança depende delas. */

// Contorno grosseiro da Irlanda do Norte. Existe porque a ilha da Irlanda tem
// dois países: uma caixa de latitude/longitude sozinha colocaria o Donegal
// (República) dentro do Reino Unido.
const NI_OUTLINE = [
  [-8.18, 54.46], [-7.90, 54.20], [-7.30, 54.12], [-6.65, 54.05], [-6.27, 54.09],
  [-5.85, 54.02], [-5.43, 54.40], [-5.50, 54.68], [-5.72, 54.85], [-6.05, 55.05],
  [-6.50, 55.25], [-7.05, 55.15], [-7.45, 55.10], [-7.55, 54.85], [-7.90, 54.70]
];

function insidePolygon(lng, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function countryFromCoords(lat, lng) {
  if (insidePolygon(lng, lat, NI_OUTLINE)) return 'GB';                       // Irlanda do Norte
  if (lat >= 51.3 && lat <= 55.5 && lng >= -10.7 && lng <= -5.3) return 'IE'; // ilha da Irlanda
  if (lat >= 49.8 && lat <= 60.9 && lng >= -8.2 && lng <= 1.8) return 'GB';   // Grã-Bretanha
  return 'IE';
}

function useMiles() {
  if (userLocation) return countryFromCoords(userLocation.lat, userLocation.lng) === 'GB';
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/London'; }
  catch { return false; }
}

function formatDistance(metres) {
  if (useMiles()) {
    const mi = metres / 1609.34;
    return mi < 0.2 ? `${Math.round(metres * 1.094)} yd` : `${mi.toFixed(1)} mi`;
  }
  return metres < 950 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

const CONFIRM_RADIUS_M = 2000;

/* ---------- Supabase e mapa ---------- */

function initDb() {
  if (!configured()) { console.warn('Supabase não configurado — veja config.example.js'); return; }
  db = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([53.3498, -6.2603], 12);
  // Mapa escuro: com o mapa claro padrão os marcadores vermelhos e o cartão de
  // status sumiam no contraste, e à noite (quando o app mais é usado) a tela
  // toda acendia na cara de quem está pilotando.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);
  // No celular o zoom é por pinça; os botões só atrapalhavam o cartão de status.
  if (window.matchMedia('(min-width:560px)').matches) {
    L.control.zoom({ position: 'topright' }).addTo(map);
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS não disponível neste aparelho.'));
    navigator.geolocation.getCurrentPosition(
      p => {
        userLocation = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        resolve(userLocation);
      },
      e => reject(new Error(e.code === 1 ? 'Permissão de localização negada.' : 'Não foi possível obter a localização.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

async function locate() {
  const p = await getPosition();
  if (userMarker) userMarker.setLatLng(p);
  else userMarker = L.circleMarker(p, { radius: 9, color: '#fff', weight: 3, fillColor: '#23f36b', fillOpacity: 1 })
    .addTo(map).bindPopup('Você está aqui');
  map.setView(p, 16);
  return p;
}

function distance(a, b) {
  const R = 6371000, toRad = x => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Arredondar para 3 casas move o ponto para uma área de ~100 m. É o que impede
// o alerta de apontar para a porta de uma casa.
function publicCoord(n) { return Math.round(n * 1000) / 1000; }

/* ---------- navegação entre telas ---------- */

function showScreen(name) {
  qsa('.screen').forEach(x => x.classList.remove('active'));
  $('screen-' + name).classList.add('active');
  qsa('.nav-btn').forEach(x => x.classList.toggle('on', x.dataset.screen === name));
  if (name === 'map') setTimeout(() => map.invalidateSize(), 80);
  if (name === 'alerts') renderAlerts();
  if (name === 'profile') renderProfile();
  if (name === 'report') resetReportFlow();
}

function openModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }

function requireAuth() {
  if (!user) { openModal('authModal'); throw new Error('Entre na sua conta para continuar.'); }
}

/* ---------- sessão e perfil ---------- */

async function refreshSession() {
  if (!db) return renderProfile();
  const { data } = await db.auth.getSession();
  user = data.session?.user || null;
  if (user) {
    const { data: p } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = p || null;
  } else {
    profile = null;
  }
  renderProfile();
}

function renderProfile() {
  $('profileGuest').classList.toggle('hidden', !!user);
  $('profileUser').classList.toggle('hidden', !user);
  if (!user) return;

  $('profileName').textContent = profile?.display_name || user.user_metadata?.display_name || 'Rider';
  $('profileEmail').textContent = user.email || '';
  $('adminLink').classList.toggle('hidden', !['admin', 'moderator'].includes(profile?.role));

  const score = profile?.reputation_score || 0;
  $('repScore').textContent = score;
  $('repAlerts').textContent = myAlerts.length;
  $('repSince').textContent = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : '—';
  // A barra é só leitura visual da reputação; 50 confirmações enchem a barra.
  $('repBar').style.width = Math.min(100, Math.round(score / 50 * 100)) + '%';
}

/* ---------- carregar e desenhar alertas ---------- */

async function loadAlerts() {
  if (!db) {
    $('alertsList').innerHTML = '<div class="card muted">Conecte o Supabase em config.js para carregar alertas reais.</div>';
    return;
  }
  const { data, error } = await db.from('alerts')
    .select('id,category,description,occurred_at,is_ongoing,latitude_public,longitude_public,status,expires_at,created_at,confirmations_count,country_code')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    $('alertsList').innerHTML = '<div class="error">' + esc(error.message) + '</div>';
    return;
  }
  alertsCache = data || [];
  await loadMyAlerts();
  renderAlerts();
  renderMapLayers();
  renderSummary();
  if (user) renderProfile();
}

async function loadMyAlerts() {
  if (!db || !user) { myAlerts = []; return; }
  const { data, error } = await db.rpc('my_alerts');
  myAlerts = error ? [] : (data || []);
}

function severityClass(cat) {
  return ({ alta: 'red', media: 'amber', baixa: 'green' })[catById(cat).severity];
}

function confidence(a) {
  const n = a.confirmations_count || 0;
  if (n >= 3) return `<span class="confidence high">✓ ${n} confirmações</span>`;
  if (n === 0) return '<span class="confidence new">Sem confirmação</span>';
  return `<span class="confidence new">${n} confirmaç${n > 1 ? 'ões' : 'ão'}</span>`;
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const h = Math.round(mins / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
}

// A aba Histórico mostra o que a própria pessoa publicou, incluindo o que já
// expirou. Não existe histórico da comunidade: alerta vencido some para todo
// mundo, e é assim que tem que ser.
function visibleAlerts() {
  return alertsTab === 'hist' ? myAlerts : alertsCache;
}

function renderAlerts() {
  const list = visibleAlerts();
  const root = $('alertsList');

  if (!list.length) {
    root.innerHTML = alertsTab === 'hist'
      ? '<div class="card muted">Você ainda não publicou nenhum alerta.</div>'
      : '<div class="card muted">Nenhum alerta ativo na comunidade agora. Isso é uma boa notícia.</div>';
    return;
  }

  root.innerHTML = list.map(a => {
    const c = catById(a.category);
    const dist = userLocation
      ? `<span>${formatDistance(distance(userLocation, { lat: a.latitude_public, lng: a.longitude_public }))}</span>`
      : '';
    return `<div class="card alert-item" data-open="${a.id}">
      <div class="alert-ico ai-${severityClass(a.category)}">${c.icon}</div>
      <div class="alert-body">
        <h4>${esc(c.label)} ${a.is_ongoing ? '<span class="badge alta">AO VIVO</span>' : ''}</h4>
        <p>${esc(a.description)}</p>
        <div class="meta"><span>${timeAgo(a.created_at)}</span>${dist}</div>
        <div class="chips">${confidence(a)}<span class="area-pill">📍 Área aproximada</span></div>
      </div>
    </div>`;
  }).join('');

  qsa('[data-open]').forEach(el => el.onclick = () => openDetail(el.dataset.open));
}

function renderMapLayers() {
  markers.forEach(m => m.remove());
  markers.clear();

  alertsCache.forEach(a => {
    const c = catById(a.category);
    const m = L.marker([a.latitude_public, a.longitude_public]).addTo(map)
      .bindPopup(`<b>${c.icon} ${esc(c.label)}</b><br>${esc(a.description)}<br><small>${timeAgo(a.created_at)}</small>`);
    markers.set(a.id, m);
  });

  if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
  if (heatOn && window.L && L.heatLayer && alertsCache.length) {
    // Peso pela gravidade: um roubo pesa mais no mapa de calor que uma via ruim.
    const pts = alertsCache.map(a => {
      const w = ({ alta: 1, media: .65, baixa: .35 })[catById(a.category).severity];
      return [a.latitude_public, a.longitude_public, w];
    });
    heatLayer = L.heatLayer(pts, {
      radius: 34, blur: 24, maxZoom: 16,
      gradient: { .3: '#23f36b', .6: '#ffd21a', 1: '#ff4d57' }
    }).addTo(map);
  }
}

function renderSummary() {
  $('statTotal').textContent = alertsCache.length;
  $('statAlta').textContent = alertsCache.filter(a => catById(a.category).severity === 'alta').length;
  $('statLive').textContent = alertsCache.filter(a => a.is_ongoing).length;
}

/* ---------- detalhe do alerta ---------- */

function openDetail(id) {
  const a = alertsCache.find(x => x.id === id) || myAlerts.find(x => x.id === id);
  if (!a) return;
  const expired = new Date(a.expires_at) <= new Date() || a.status !== 'active';
  const c = catById(a.category);
  const dist = userLocation
    ? formatDistance(distance(userLocation, { lat: a.latitude_public, lng: a.longitude_public })) + ' de você'
    : 'distância desconhecida';
  const expires = new Date(a.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  $('detailBody').innerHTML = `
    <button class="back" id="detailBack">← Voltar</button>
    <div class="detail-head">
      <div class="big ai-${severityClass(a.category)}">${c.icon}</div>
      <h2 class="title">${esc(c.label)}</h2>
      <div class="chips center">${confidence(a)}${a.is_ongoing ? '<span class="badge alta">AO VIVO</span>' : ''}</div>
    </div>
    <div class="card"><p>${esc(a.description)}</p>
      <div class="meta" style="margin-top:10px"><span>Publicado ${timeAgo(a.created_at)}</span><span>${dist}</span></div>
    </div>
    <div class="privacy-box"><span>🛡️</span><p>A posição mostrada é <b>aproximada</b>, para proteger quem publicou. Não vá ao local para confrontar ninguém — em risco imediato, ligue 999 ou 112.</p></div>
    <div class="confirm-row">
      ${expired ? '' : `<button class="btn primary" data-confirm="${a.id}" data-lat="${a.latitude_public}" data-lng="${a.longitude_public}">✓ Confirmar</button>`}
      <button class="btn ghost" data-map="${a.latitude_public},${a.longitude_public}">Ver no mapa</button>
    </div>
    <div class="expiry">${expired ? 'Este alerta já <b>expirou</b>' : `Expira às <b>${expires}</b>`}</div>
    ${expired ? '' : `<button class="danger-link" data-report="${a.id}">Denunciar este alerta</button>`}`;

  showScreen('detail');
  bindDetailActions();
}

function bindDetailActions() {
  $('detailBack').onclick = () => showScreen('alerts');
  qsa('[data-map]').forEach(b => b.onclick = () => {
    const [lat, lng] = b.dataset.map.split(',').map(Number);
    showScreen('map');
    map.setView([lat, lng], 16);
  });
  qsa('[data-report]').forEach(b => b.onclick = () => {
    $('reportedAlertId').value = b.dataset.report;
    openModal('reportModal');
  });
  qsa('[data-confirm]').forEach(b => b.onclick = () =>
    confirmAlert(b.dataset.confirm, { lat: +b.dataset.lat, lng: +b.dataset.lng }));
}

async function confirmAlert(id, alertPos) {
  try {
    requireAuth();
    const p = await getPosition();
    const d = Math.round(distance(p, alertPos));
    if (d > CONFIRM_RADIUS_M) {
      throw new Error(`Você está a ${formatDistance(d)} daqui. Só dá para confirmar a até ${formatDistance(CONFIRM_RADIUS_M)} do alerta.`);
    }
    const { error } = await db.from('alert_confirmations')
      .insert({ alert_id: id, user_id: user.id, distance_metres: d });
    if (error) throw error;
    toast('Alerta confirmado. Obrigado por ajudar.');
    await loadAlerts();
    openDetail(id);
  } catch (e) {
    toast(/duplicate|unique/i.test(e.message) ? 'Você já confirmou este alerta.' : e.message, 'err');
  }
}

/* ---------- fluxo de reportar em 3 passos ---------- */

function resetReportFlow() {
  draft = { category: '', description: '', duration: 180, ongoing: false, occurred: 'agora' };
  qsa('.type-opt').forEach(o => o.classList.remove('sel'));
  $('rdesc').value = '';
  $('rongoing').checked = false;
  $('next1').disabled = true;
  msg($('alertMsg'), '');
  goStep(1);
}

function goStep(n) {
  [1, 2, 3].forEach(i => {
    $('rstep' + i).style.display = i === n ? 'block' : 'none';
    $('sd' + i).classList.toggle('on', i <= n);
  });
  if (n === 3) {
    const c = catById(draft.category);
    $('cfType').textContent = `${c.icon} ${c.label}`;
    $('cfDesc').textContent = draft.description || 'Sem descrição adicional.';
    $('cfWhen').textContent = `⏰ Fica no ar por ${draft.duration >= 60 ? draft.duration / 60 + ' h' : draft.duration + ' min'}`;
  }
}

function pickType(el) {
  qsa('.type-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  draft.category = el.dataset.cat;
  $('next1').disabled = false;
}

async function goToStep2() {
  // Pede o GPS aqui, e não no envio, para a pessoa não escrever tudo e só
  // então descobrir que a permissão está negada.
  try {
    const p = await getPosition();
    $('stepLocation').innerHTML =
      `<b>Sua localização atual</b><p>Precisão de ${Math.round(p.accuracy)} m · publicada como área aproximada</p>`;
    goStep(2);
  } catch (e) {
    toast(e.message, 'err');
  }
}

async function publishAlert() {
  try {
    requireAuth();
    const p = await getPosition();
    if (draft.description.length < 10) throw new Error('Descreva o risco com pelo menos 10 caracteres.');

    const occurredMap = { agora: 0, '5_min': 5, '15_min': 15, '30_min': 30, '1_hora': 60 };
    const { error } = await db.from('alerts').insert({
      user_id: user.id,
      category: draft.category,
      description: draft.description,
      occurred_at: new Date(Date.now() - occurredMap[draft.occurred] * 60000).toISOString(),
      is_ongoing: draft.ongoing,
      latitude_private: p.lat,
      longitude_private: p.lng,
      latitude_public: publicCoord(p.lat),
      longitude_public: publicCoord(p.lng),
      country_code: countryFromCoords(p.lat, p.lng),
      expires_at: new Date(Date.now() + draft.duration * 60000).toISOString()
    });
    if (error) throw error;

    toast('Alerta publicado com área aproximada.');
    resetReportFlow();
    showScreen('alerts');
    loadAlerts();
  } catch (err) {
    msg($('alertMsg'), err.message);
    toast(err.message, 'err');
  }
}

async function submitReport(e) {
  e.preventDefault();
  try {
    requireAuth();
    const { error } = await db.from('alert_reports').insert({
      alert_id: $('reportedAlertId').value,
      reported_by: user.id,
      reason: $('reportReason').value,
      details: $('reportDetails').value.trim()
    });
    if (error) throw error;
    msg($('reportMsg'), 'Denúncia enviada para moderação.', 'success');
    setTimeout(() => closeModal('reportModal'), 700);
  } catch (err) {
    msg($('reportMsg'), err.message);
  }
}

/* ---------- autenticação ---------- */

async function authSubmit(e) {
  e.preventDefault();
  if (!db) return msg($('authMsg'), 'Configure o Supabase primeiro.');
  const email = $('authEmail').value.trim(), password = $('authPassword').value;
  try {
    if (authMode === 'signup') {
      const { error } = await db.auth.signUp({
        email, password,
        options: { data: { display_name: $('authName').value.trim() }, emailRedirectTo: cfg.SITE_URL }
      });
      if (error) throw error;
      msg($('authMsg'), 'Conta criada. Confirme pelo e-mail que enviamos.', 'success');
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal('authModal');
      await refreshSession();
      toast('Bem-vindo de volta.');
    }
  } catch (err) {
    msg($('authMsg'), err.message);
  }
}

async function forgot() {
  if (!db) return;
  const email = $('authEmail').value.trim();
  if (!email) return msg($('authMsg'), 'Digite seu e-mail primeiro.');
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: cfg.SITE_URL });
  msg($('authMsg'), error ? error.message : 'E-mail de redefinição enviado.', error ? 'error' : 'success');
}

// O link do e-mail de recuperação volta para o site com uma sessão temporária.
// Sem tratar PASSWORD_RECOVERY a pessoa clicava no link e não acontecia nada:
// a sessão abria e o app seguia como se fosse um login comum.
async function applyNewPassword(e) {
  e.preventDefault();
  const pass = $('newPassword').value, confirmPass = $('newPasswordConfirm').value;
  if (pass.length < 8) return msg($('newPassMsg'), 'A senha precisa ter ao menos 8 caracteres.');
  if (pass !== confirmPass) return msg($('newPassMsg'), 'As duas senhas não são iguais.');
  const { error } = await db.auth.updateUser({ password: pass });
  if (error) return msg($('newPassMsg'), error.message);
  msg($('newPassMsg'), 'Senha atualizada.', 'success');
  setTimeout(() => { closeModal('recoveryModal'); toast('Senha alterada com sucesso.'); }, 800);
}

/* ---------- emergência e conta ---------- */

async function shareLocation(copyOnly = false) {
  try {
    const p = await getPosition();
    const url = `https://www.google.com/maps?q=${p.lat},${p.lng}`;
    const text = `🚨 Preciso de ajuda. Esta é minha localização atual:\n${url}\n\nEnviado pelo Radar Rider.`;
    if (copyOnly) {
      await navigator.clipboard.writeText(text);
      msg($('emergencyMsg'), 'Localização copiada.', 'success');
    } else {
      location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
  } catch (e) {
    msg($('emergencyMsg'), e.message);
  }
}

async function requestDeletion() {
  if (!confirm('Deseja solicitar a exclusão da sua conta e dos dados associados?')) return;
  try {
    requireAuth();
    const { error } = await db.from('account_deletion_requests').insert({ user_id: user.id, email: user.email });
    if (error) throw error;
    toast('Solicitação registrada. O suporte fará a exclusão segura.');
  } catch (e) {
    toast(e.message, 'err');
  }
}

/* ---------- instalação do PWA ---------- */

function setupInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    $('installBtn').classList.remove('hidden');
  });

  const run = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      return;
    }
    // iPhone nunca dispara beforeinstallprompt: no Safari a instalação é manual.
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $('installHelp').innerHTML = ios
      ? 'No iPhone, abra este site no <b>Safari</b>, toque em <b>Compartilhar</b> (o quadrado com a seta para cima) e depois em <b>Adicionar à Tela de Início</b>.'
      : 'No Android, abra o menu do navegador (⋮) e toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.';
    openModal('installModal');
  };

  $('installBtn').onclick = run;
  $('installProfileBtn').onclick = run;
}

/* ---------- ligações de eventos ---------- */

function bind() {
  qsa('.nav-btn').forEach(b => b.onclick = () => showScreen(b.dataset.screen));
  qsa('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
  qsa('.type-opt').forEach(o => o.onclick = () => pickType(o));

  $('emergencyBtn').onclick = () => openModal('emergencyModal');
  $('openAuthBtn').onclick = () => openModal('authModal');
  $('locateBtn').onclick = () => locate().catch(e => toast(e.message, 'err'));

  $('heatBtn').onclick = () => {
    heatOn = !heatOn;
    $('heatBtn').classList.toggle('on', heatOn);
    renderMapLayers();
  };

  $('next1').onclick = goToStep2;
  $('back2').onclick = () => goStep(1);
  $('next2').onclick = () => {
    draft.description = $('rdesc').value.trim();
    draft.ongoing = $('rongoing').checked;
    draft.occurred = $('roccurred').value;
    draft.duration = +$('rduration').value;
    goStep(3);
  };
  $('back3').onclick = () => goStep(2);
  $('publishBtn').onclick = publishAlert;

  qsa('.tab').forEach(t => t.onclick = () => {
    alertsTab = t.dataset.tab;
    qsa('.tab').forEach(x => x.classList.toggle('on', x === t));
    renderAlerts();
  });

  $('reportForm').onsubmit = submitReport;
  $('authForm').onsubmit = authSubmit;
  $('recoveryForm').onsubmit = applyNewPassword;
  $('forgotBtn').onclick = forgot;
  $('shareWhatsAppBtn').onclick = () => shareLocation(false);
  $('copyLocationBtn').onclick = () => shareLocation(true);

  $('logoutBtn').onclick = async () => {
    await db.auth.signOut();
    user = null; profile = null;
    renderProfile();
    toast('Você saiu da conta.');
  };
  $('resetPasswordBtn').onclick = async () => {
    const { error } = await db.auth.resetPasswordForEmail(user.email, { redirectTo: cfg.SITE_URL });
    toast(error ? error.message : 'E-mail enviado.', error ? 'err' : 'ok');
  };
  $('deleteAccountBtn').onclick = requestDeletion;

  qsa('.auth-tab').forEach(b => b.onclick = () => {
    authMode = b.dataset.auth;
    qsa('.auth-tab').forEach(x => x.classList.toggle('active', x === b));
    $('nameWrap').classList.toggle('hidden', authMode !== 'signup');
  });
}

/* ---------- inicialização ---------- */

async function boot() {
  initDb();
  initMap();
  bind();
  setupInstall();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');

  await refreshSession();
  await loadAlerts();

  // Centraliza no rider assim que ele permitir o GPS; se negar, segue em Dublin.
  locate().catch(() => {});

  if (db) {
    db.channel('public-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, loadAlerts)
      .subscribe();

    db.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        closeModal('authModal');
        openModal('recoveryModal');
        return;
      }
      setTimeout(refreshSession, 0);
    });
  }

  setTimeout(() => $('splash').classList.add('hide'), 900);
}

document.addEventListener('DOMContentLoaded', boot);
