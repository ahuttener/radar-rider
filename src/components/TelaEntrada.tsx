'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { BandeiraIE, BandeiraGB } from '@/components/Bandeiras';
import { lerPaisSalvo, salvarPais, paisPeloFusoHorario } from '@/components/SeletorPais';
import { useInstalacao, ModalInstalar, RegistrarServiceWorker } from '@/components/InstalarApp';
import type { CountryCode } from '@/lib/geo';

// Tela de apresentação + login/cadastro.
//
// É a "cara" do Radar Rider: aparece em www.radarrider.com para quem ainda não
// está logado (ver src/app/page.tsx) e também na rota /entrar, que é onde cai o
// link do e-mail de confirmação. Depois do login vai para "/", que passa a
// mostrar o app.

// DDIs para o cadastro. O topo tem os três que importam para este público
// (Irlanda, Reino Unido e Brasil — muito entregador aqui mantém o número do
// Brasil); o resto é a lista de onde costuma vir quem usa o app. O <select>
// nativo abre a roda de rolagem do próprio celular.
const DDIS: Array<{ dial: string; nome: string }> = [
  { dial: '+353', nome: 'Irlanda' },
  { dial: '+44', nome: 'Reino Unido' },
  { dial: '+55', nome: 'Brasil' },
  { dial: '+351', nome: 'Portugal' },
  { dial: '+1', nome: 'EUA / Canadá' },
  { dial: '+34', nome: 'Espanha' },
  { dial: '+33', nome: 'França' },
  { dial: '+49', nome: 'Alemanha' },
  { dial: '+39', nome: 'Itália' },
  { dial: '+31', nome: 'Países Baixos' },
  { dial: '+32', nome: 'Bélgica' },
  { dial: '+41', nome: 'Suíça' },
  { dial: '+43', nome: 'Áustria' },
  { dial: '+45', nome: 'Dinamarca' },
  { dial: '+46', nome: 'Suécia' },
  { dial: '+47', nome: 'Noruega' },
  { dial: '+48', nome: 'Polônia' },
  { dial: '+61', nome: 'Austrália' },
  { dial: '+64', nome: 'Nova Zelândia' },
  { dial: '+352', nome: 'Luxemburgo' },
];

export default function TelaEntrada() {
  const router = useRouter();
  const [modo, setModo] = useState<'login' | 'criar'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [nome, setNome] = useState('');
  const [ddi, setDdi] = useState('+353');
  const [telefone, setTelefone] = useState('');
  const [maior18, setMaior18] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Quando o cadastro é aceito, guarda o e-mail para mostrar a tela de
  // "confira seu e-mail" no lugar do formulário.
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  const { prompt: promptInstalar, instalado } = useInstalacao();
  const [modalInstalar, setModalInstalar] = useState(false);

  // País: aqui não existe GPS — quem ainda não tem conta não deve ser obrigado
  // a entregar a localização para ver a tela de login. Então parte do que já
  // estiver salvo e, na falta disso, do fuso horário.
  const [pais, setPais] = useState<CountryCode>('IE');
  useEffect(() => {
    const salvo = lerPaisSalvo();
    setPais(salvo === 'IE' || salvo === 'GB' ? salvo : paisPeloFusoHorario());
  }, []);

  function escolherPais(p: CountryCode) {
    setPais(p);
    salvarPais(p);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);

    try {
      if (modo === 'criar') {
        // Telefone em E.164: DDI escolhido + só os dígitos do que a pessoa
        // digitou (tira espaço, traço, parênteses e um zero inicial de tronco).
        const numero = telefone.replace(/\D/g, '').replace(/^0+/, '');
        const phone = `${ddi}${numero}`;

        const r = await fetch('/api/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            password: senha,
            displayName: nome,
            phone,
            isAdult: maior18,
            acceptedTerms: aceitouTermos,
          }),
        });
        const j = await r.json();
        if (!r.ok) return setMsg({ texto: j.erro ?? 'Não foi possível criar a conta.' });
        // Sucesso: troca o formulário pela tela de "confira seu e-mail".
        return setEnviadoPara(email.trim());
      }

      const r = await signIn('credentials', { email, password: senha, redirect: false });
      if (r?.error) {
        // A mensagem é a mesma para senha errada e e-mail inexistente: separar
        // as duas entrega quem tem conta no app para quem estiver testando.
        const texto =
          r.error === 'EMAIL_NAO_CONFIRMADO'
            ? 'Confirme seu e-mail primeiro. O link está na sua caixa de entrada.'
            : r.error === 'CONTA_BANIDA'
              ? 'Esta conta foi banida por violar as regras da comunidade.'
              : r.error === 'CONTA_SUSPENSA'
                ? 'Esta conta está suspensa temporariamente. Tente novamente mais tarde.'
                : r.error === 'MUITAS_TENTATIVAS'
                  ? 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
                  : 'E-mail ou senha incorretos.';
        return setMsg({ texto });
      }
      router.push('/');
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  function trocarModo(novo: 'login' | 'criar') {
    setModo(novo);
    setMsg(null);
  }

  return (
    <div className="auth-shell">
      {/* Sem service worker registrado o Android nunca dispara
          `beforeinstallprompt`, e o botão de instalar aqui embaixo cairia nas
          instruções manuais. Esta tela precisa registrar por conta própria: é
          onde cai o link do e-mail de confirmação, então para muita gente ela é
          a PRIMEIRA página do site, não a segunda. */}
      <RegistrarServiceWorker />

      {/* ================= apresentação ================= */}
      <section className="auth-hero">
        <div className="auth-top">
          <div className="auth-brand-col">
            <Link className="auth-brand" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-512.png" alt="Radar Rider" />
              <div>
                <h1>RADAR <span>RIDER</span></h1>
                <small>SEGURANÇA COMUNITÁRIA</small>
              </div>
            </Link>
            {/* Selo de origem: o Radar Rider é um produto BRDeals. */}
            <a
              className="by-brdeals"
              href="https://www.brdeals.ie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BRDeals Irlanda — abre em uma nova aba"
            >
              <span aria-hidden="true">by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brdeals-logo.png" alt="BRDeals" />
            </a>
          </div>

          <div className="auth-country" role="group" aria-label="Onde você roda">
            <button className={pais === 'IE' ? 'active' : ''} aria-pressed={pais === 'IE'}
                    onClick={() => escolherPais('IE')}>
              <BandeiraIE className="flag" /> IRL
            </button>
            <button className={pais === 'GB' ? 'active' : ''} aria-pressed={pais === 'GB'}
                    onClick={() => escolherPais('GB')}>
              <BandeiraGB className="flag" /> UK
            </button>
          </div>
        </div>

        <div className="auth-copy">
          <span className="auth-eyebrow">● ALERTAS COMUNITÁRIOS EM TEMPO REAL</span>
          <h2>Mais segurança para quem está <span>na rua.</span></h2>
          <p>
            Receba alertas, informe situações de risco e ajude a proteger outros
            entregadores na Irlanda e no Reino Unido.
          </p>
          <div className="auth-points">
            <span className="auth-point">📍 Localização aproximada</span>
            <span className="auth-point">🛡️ Privacidade protegida</span>
            <span className="auth-point">🚨 Emergência 999 e 112</span>
          </div>
        </div>

        <div className="auth-legal">
          <span>© {new Date().getFullYear()} Radar Rider</span>
          <Link href="/privacidade">Política de Privacidade</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/cookies">Cookies</Link>
        </div>

        <div className="auth-radar" aria-hidden="true" />
      </section>

      {/* ================= login ================= */}
      <aside className="auth-side">
        <div className="auth-card">
          <div className="auth-mini-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-512.png" alt="" />
          </div>

          {enviadoPara ? (
            <div className="auth-check-email">
              <div className="auth-check-email-icon" aria-hidden="true">📧</div>
              <h3>Confira seu e-mail</h3>
              <p className="auth-sub">
                Enviamos um link de confirmação para <b>{enviadoPara}</b>. Abra a
                mensagem e toque no link para ativar sua conta.
              </p>
              <div className="privacy-box ok" style={{ display: 'block', marginTop: 12 }}>
                <p>
                  Não chegou em alguns minutos? Procure na <b>caixa de spam</b> ou
                  lixo eletrônico. O link vale por tempo limitado.
                </p>
              </div>
              <button
                className="auth-submit"
                style={{ marginTop: 16 }}
                onClick={() => { setEnviadoPara(null); setModo('login'); setSenha(''); }}
              >
                Voltar para entrar
              </button>
            </div>
          ) : (
          <>
          <h3>{modo === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}</h3>
          <p className="auth-sub">
            {modo === 'login'
              ? 'Entre para acessar o mapa, confirmar alertas e colaborar com a comunidade.'
              : 'Seu nome nunca aparece junto de um alerta. A conta existe para a moderação poder agir quando alguém abusa.'}
          </p>

          <div className="auth-tabs">
            <button className={modo === 'login' ? 'on' : ''} onClick={() => trocarModo('login')}>
              Entrar
            </button>
            <button className={modo === 'criar' ? 'on' : ''} onClick={() => trocarModo('criar')}>
              Criar conta
            </button>
          </div>

          <form onSubmit={enviar}>
            {modo === 'criar' && (
              <>
                <label htmlFor="nome">Nome público</label>
                <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                       required minLength={2} maxLength={40}
                       placeholder="Como os outros entregadores vão te ver" />

                <label htmlFor="telefone">Telefone</label>
                <div className="auth-phone">
                  <select
                    className="auth-ddi"
                    aria-label="Código do país (DDI)"
                    value={ddi}
                    onChange={(e) => setDdi(e.target.value)}
                  >
                    {DDIS.map(({ dial, nome: pais }) => (
                      <option key={dial + pais} value={dial}>{dial} · {pais}</option>
                    ))}
                  </select>
                  <input
                    id="telefone" type="tel" inputMode="numeric" autoComplete="tel-national"
                    required value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Número com DDD"
                  />
                </div>
              </>
            )}

            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" required
                   placeholder="seuemail@exemplo.com"
                   value={email} onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="senha">Senha</label>
            <div className="auth-pass">
              <input id="senha" type={verSenha ? 'text' : 'password'} required minLength={8}
                     autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                     placeholder={modo === 'criar' ? 'Pelo menos 8 caracteres' : 'Digite sua senha'}
                     value={senha} onChange={(e) => setSenha(e.target.value)} />
              <button type="button" onClick={() => setVerSenha((v) => !v)}
                      aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                {verSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {modo === 'criar' && (
              <div className="auth-checks">
                <label>
                  <input type="checkbox" required checked={maior18}
                         onChange={(e) => setMaior18(e.target.checked)} />
                  Confirmo que tenho 18 anos ou mais.
                </label>
                <label>
                  <input type="checkbox" required checked={aceitouTermos}
                         onChange={(e) => setAceitouTermos(e.target.checked)} />
                  Li e aceito os <Link href="/termos">Termos de Uso</Link> e a{' '}
                  <Link href="/privacidade">Política de Privacidade</Link>.
                </label>
              </div>
            )}

            {modo === 'login' && (
              <Link className="auth-forgot" href="/esqueci-a-senha">Esqueci minha senha</Link>
            )}

            <button className="auth-submit" type="submit" disabled={enviando}>
              {enviando
                ? 'Aguarde…'
                : modo === 'criar' ? 'Criar minha conta' : 'Entrar no Radar Rider'}
            </button>

            {msg && (
              <div className={msg.ok ? 'success' : 'error'} style={{ marginTop: 14 }}>
                {msg.texto}
              </div>
            )}
          </form>

          <div className="auth-notice">
            Ao continuar, você concorda com os{' '}
            <Link href="/termos">Termos de Uso</Link> e confirma que leu a{' '}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </div>

          <div className="auth-contact">
            Precisa de ajuda? <b>contato@radarrider.com</b>
          </div>

          {!instalado && (
            <div className="auth-install">
              <button onClick={() => setModalInstalar(true)}>＋ Adicionar à tela inicial</button>
            </div>
          )}

          {/* No celular a apresentação fica acima e os links legais dela são
              escondidos; sem esta linha, não sobraria caminho para eles. */}
          <div className="auth-legal-mobile">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
          </>
          )}
        </div>
      </aside>

      {modalInstalar && (
        <ModalInstalar prompt={promptInstalar} aoFechar={() => setModalInstalar(false)} />
      )}
    </div>
  );
}
