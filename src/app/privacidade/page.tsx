import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { legalIdentity, PRIVACY_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy — Radar Rider',
  description: 'What data Radar Rider keeps, why, for how long and how to request deletion.',
};

export default function Privacidade() {
  const identity = legalIdentity();
  return (
    <PaginaLegal titulo="Privacy Policy" atualizadoEm="July 23, 2026" lang="en">
      <div className="privacy-box">
        <span>🛡️</span>
        <p>
          The one-sentence summary: we keep the minimum needed for the app to
          work, your alert&apos;s position leaves the map blurred, and{' '}
          <b>your name never appears next to an alert</b>.
        </p>
      </div>

      <h3>Who is responsible</h3>
      <p>
        <b>{identity.name}</b>, established at {identity.address}, operates Radar
        Rider as an individual and is the data controller. For privacy matters,
        write to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>
      {identity.incomplete && (
        <div className="privacy-box">
          <span>⚠️</span><p>
            <b>Pre-launch version:</b> the controller&apos;s legal name and
            postal address still need to be configured before commercial launch.
          </p>
        </div>
      )}

      <h3>What data we collect</h3>
      <ul>
        <li>
          <b>Your account:</b> public name, email, phone number, and your
          password stored irreversibly as a hash (not even we can read it).
        </li>
        <li>
          <b>Your alerts:</b> category, description, when it happened and the
          location.
        </li>
        <li>
          <b>Your location:</b> read only when you post an alert, confirm someone
          else&apos;s alert, or tap &quot;My location&quot;. The app does not
          track you in the background.
        </li>
        <li>
          <b>Confirmations and reports</b> you make about other people&apos;s
          alerts.
        </li>
        <li>
          <b>Technical data:</b> IP address, browser, device and error or
          security logs may appear in the hosting provider&apos;s logs.
        </li>
      </ul>
      <p>
        Today we do not collect profile photos, uploaded images, contact lists,
        push notification tokens, advertising data or analytics. If that
        changes, this policy and the consent choices will be updated first.
      </p>

      <h3>What happens with your location</h3>
      <p>
        This is the most important part of the app, so it is spelled out. When
        you post an alert, we store <b>two</b> coordinates:
      </p>
      <ul>
        <li>
          The <b>public</b> one, rounded to an area of roughly 100 metres. It is
          the only one that goes to the map, the app and any other person.
        </li>
        <li>
          The <b>exact</b> one, which is stored and <b>never leaves the site in
          a response</b>. It exists only so moderation can act when someone uses
          the app to stalk or intimidate another person, and to comply with a
          lawful police request.
        </li>
      </ul>
      <p>
        The blurring is done on our server, not on your phone. That prevents
        anyone from tampering with the app to post an alert pointing at
        someone&apos;s front door.
      </p>

      <h3>Why we may use this data</h3>
      <ul>
        <li>
          <b>Performance of a contract:</b> your account and your alerts —
          without them the app cannot work.
        </li>
        <li>
          <b>Consent:</b> your location. The browser asks first, and you can
          refuse or revoke it in your device settings at any time. Without it you
          can read the map, but you cannot post or confirm.
        </li>
        <li>
          <b>Legitimate interest:</b> moderation, abuse prevention and posting
          limits — keeping the map trustworthy for the rider community.
        </li>
      </ul>

      <h3>Who we share with</h3>
      <p>We do not sell your data and we do not run advertising. We use only:</p>
      <ul>
        <li>
          <b>Hostinger</b> — hosting of the site, the database and delivery of
          our emails (account confirmation and password recovery).
        </li>
        <li>
          <b>CARTO and OpenStreetMap</b> — the map imagery. When the map loads,
          your IP address reaches these services, as happens with any image a
          site loads.
        </li>
      </ul>
      <p>
        We may also disclose data to authorities where we are legally required
        to do so.
      </p>
      <p>
        Internal access is limited to the operator and authorised moderators,
        only when needed for support, security, moderation or compliance with a
        legal obligation. Providers process data only to deliver their service.
      </p>

      <h3>International transfers</h3>
      <p>
        Some map or infrastructure providers may process data outside the
        European Economic Area. Where applicable, we use the contractual
        safeguards required by the GDPR and assess the provider before use.
      </p>

      <h3>How long we keep it</h3>
      <ul>
        <li>
          <b>Alerts, confirmations and reports:</b> the alert leaves the map
          after 1 to 12 hours and the records are deleted within 12 months.
        </li>
        <li>
          <b>Account:</b> for as long as it exists. On deletion, we immediately
          remove direct identifiers and keep only anonymised records needed for
          their retention periods.
        </li>
        <li>
          <b>Buy Me a Coffee:</b> only if you tap &quot;Support&quot;. The link
          opens the external site, subject to its own privacy policy.
        </li>
        <li><b>Email tokens:</b> up to 30 days after being used or expired.</li>
        <li><b>Moderation actions:</b> up to 12 months.</li>
      </ul>

      <h3>Your rights</h3>
      <p>
        Under the GDPR (and the UK GDPR, if you are in the United Kingdom) you
        may request: access to your data, correction, deletion, portability,
        restriction of use and objection to processing. Just write to{' '}
        <a href="mailto:contato@radarrider.com">contato@radarrider.com</a> — we
        normally reply within one month. You can also use the{' '}
        <a href="/rgpd">Your GDPR rights</a> page.
      </p>
      <p>
        If you believe we have handled your data wrongly, you can complain to
        the authority in your country: the{' '}
        <a href="https://www.dataprotection.ie" target="_blank" rel="noopener">
          Data Protection Commission
        </a>{' '}
        in Ireland, or the{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener">ICO</a> in
        the United Kingdom.
      </p>

      <h3>Minimum age</h3>
      <p>
        Radar Rider is for adults aged 18 and over only. We do not allow
        accounts for children or teenagers and we remove any account identified
        as such.
      </p>

      <h3>Automated decisions and the obligation to provide data</h3>
      <p>
        We do not make decisions with legal effect solely by algorithm. Email,
        public name, phone number and password are required to create an
        account; GPS is optional for viewing the map, but required to post or
        confirm an alert. You can refuse the GPS permission on your device.
      </p>

      <h3>Changes to this policy</h3>
      <p>
        If we change anything material, we update the date at the top of this
        page and announce it inside the app.
      </p>
    </PaginaLegal>
  );
}
