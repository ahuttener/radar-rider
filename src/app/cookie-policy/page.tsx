import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { PRIVACY_EMAIL, LEGAL_UPDATED_EN } from '@/lib/legal';

// Versão INGLESA da política de cookies. A principal é a portuguesa (/cookies).
// A rota não é /cookies porque essa é a portuguesa — em inglês "cookie policy"
// é o nome natural. As duas dizem a mesma coisa.

export const metadata: Metadata = {
  title: 'Cookie Policy — Radar Rider',
  description: 'Which cookies Radar Rider uses. We do not use tracking or advertising.',
  alternates: {
    canonical: '/cookie-policy',
    languages: { 'pt-BR': '/cookies', en: '/cookie-policy' },
  },
};

export default function CookiePolicy() {
  return (
    <PaginaLegal
      titulo="Cookie Policy"
      atualizadoEm={LEGAL_UPDATED_EN}
      lang="en"
      versaoEm="/cookies"
    >
      <div className="privacy-box ok" style={{ display: 'block' }}>
        <p>
          <b>Radar Rider uses no tracking, advertising or analytics cookies.</b>{' '}
          Only the ones that make the app work. There is nothing here for you to
          switch off, which is why we do not bury you under a panel of choices.
        </p>
      </div>

      <h3>What a cookie is</h3>
      <p>
        A small file the site stores in your browser to remember something
        between one page and the next — for example, that you have already
        signed in to your account.
      </p>

      <h3>The ones we use</h3>

      <table className="legal-table">
        <thead>
          <tr><th>Name</th><th>What it does</th><th>Lasts</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>__Secure-next-auth.session-token</code></td>
            <td>Keeps you signed in to your account. Without it, you would have
                to sign in again on every page.</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td><code>__Host-next-auth.csrf-token</code></td>
            <td>Security: stops another site from submitting forms in your
                name.</td>
            <td>Session</td>
          </tr>
          <tr>
            <td><code>__Secure-next-auth.callback-url</code></td>
            <td>Remembers which screen to take you to after sign-in.</td>
            <td>Session</td>
          </tr>
        </tbody>
      </table>

      <p>
        Locally or without HTTPS, the <code>__Secure-</code> and{' '}
        <code>__Host-</code> prefixes may not appear. The purpose is unchanged.
      </p>

      <p>
        All of these are <b>strictly necessary</b>. Under the EU ePrivacy rules
        — and, in the United Kingdom, under the Privacy and Electronic
        Communications Regulations (PECR) — cookies of this kind do not require
        consent. What requires consent are analytics and advertising cookies,
        which we do not use.
      </p>

      <h3>What we keep on your device outside cookies</h3>
      <p>
        The app also uses your browser&apos;s local storage for two of your
        preferences. They never leave your device and never reach us:
      </p>
      <ul>
        <li><code>rr-aviso-cookies</code> — remembers that you have dismissed the cookie notice.</li>
        <li><code>rr-pais</code> — remembers whether you were viewing Ireland or the United Kingdom.</li>
      </ul>

      <h3>How to delete them</h3>
      <p>
        In your browser settings, under &quot;Privacy&quot; or &quot;Browsing
        data&quot;. If you delete them, you are signed out and the preferences
        above return to their defaults — nothing else is lost.
      </p>

      <h3>Support link</h3>
      <p>
        The &quot;Support&quot; button is just a link. Buy Me a Coffee loads no
        code and stores no cookies inside Radar Rider. When you open the
        external site, that service&apos;s own choices and cookie policy apply.
      </p>

      <h3>Questions</h3>
      <p>
        Write to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. See
        also our <a href="/privacy">privacy policy</a> to understand what we do
        with your account and alert data.
      </p>
    </PaginaLegal>
  );
}
