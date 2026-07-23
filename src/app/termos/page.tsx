import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';

export const metadata: Metadata = {
  title: 'Terms of Use — Radar Rider',
  description: 'The rules of Radar Rider: what you may post and what the app is not.',
};

export default function Termos() {
  return (
    <PaginaLegal titulo="Terms of Use" atualizadoEm="July 23, 2026" lang="en">
      <div className="privacy-box">
        <span>⚠️</span>
        <p>
          <b>Radar Rider is not an emergency service.</b> In immediate danger,
          call <b>999</b> or <b>112</b>. The app does not call the police for
          you, and no one on the other side is on duty reading the alerts.
        </p>
      </div>

      <p>
        By using Radar Rider you agree to these rules. They are deliberately
        short.
      </p>

      <h3>1. What Radar Rider is</h3>
      <p>
        A noticeboard made by delivery riders, for delivery riders, in Ireland
        and the United Kingdom. Alerts are posted by other people in the
        community — <b>they are not verified by us</b> and are not official
        police information. Treat each alert for what it is: a report from a
        fellow rider. Use your own judgement before changing your route.
      </p>

      <h3>2. Your account</h3>
      <ul>
        <li>You must be 18 or older.</li>
        <li>Use a real email address that is yours — it is how we recover your password.</li>
        <li>Your password is your responsibility. Do not share your account.</li>
        <li>Your public name never appears next to an alert.</li>
      </ul>

      <h3>3. What you may NOT post</h3>
      <p>This is the part that leads to an alert being removed and an account suspended:</p>
      <ul>
        <li>
          <b>Identifying people.</b> No names, licence plates, photos,
          addresses, clothing descriptions, or anything pointing to a specific
          person. Describe the <i>risk</i>, not the suspect.
        </li>
        <li>
          <b>Descriptions by race, ethnicity, nationality or religion.</b> A
          group does not become a danger because of who they are. That is not a
          safety alert, it is discrimination, and it is removed immediately.
        </li>
        <li><b>False or made-up alerts.</b> Spreading panic harms people on the street.</li>
        <li><b>Calls for retaliation, revenge or vigilante justice.</b></li>
        <li><b>Advertising, sales, job posts, chain messages or spam.</b></li>
        <li><b>Using the app to follow, watch or intimidate anyone.</b></li>
      </ul>
      <p>
        Post only what you saw or lived through, and only up to 1 hour after it
        happened. An old alert draws attention away from what is happening now.
      </p>

      <h3>4. Confirmations and reports</h3>
      <p>
        You can only confirm an alert if you are near it. Confirming something
        you did not witness breaks the one thing that separates what is real
        from rumour. Saw something against the rules? Use the report button — it
        is the right path, and it works.
      </p>

      <h3>5. Moderation</h3>
      <p>
        We may remove any alert and suspend or close any account that breaks
        these rules, without prior notice where someone is at risk. If you think
        we got it wrong, write to{' '}
        <a href="mailto:contato@radarrider.com">contato@radarrider.com</a>.
      </p>

      <h3>6. What stays yours</h3>
      <p>
        The text you post remains yours. By posting, you give us permission to
        display it inside Radar Rider to the community. Nothing more — we do not
        resell and do not license your content to third parties.
      </p>

      <h3>7. Limit of our liability</h3>
      <p>
        Radar Rider is provided &quot;as is&quot;, free of charge and with no
        guarantee that it will be available, accurate or complete. We are not
        liable for loss arising from an inaccurate, delayed, missing or false
        alert, nor for decisions you make based on one. Nothing here excludes
        liability that the law does not allow to be excluded — for death or
        personal injury caused by negligence, or for fraud, for example.
      </p>

      <h3>8. Changes and governing law</h3>
      <p>
        We may update these terms; the date at the top shows the latest version,
        and material changes are announced inside the app. These terms are
        governed by the law of Ireland, without prejudice to the consumer rights
        you may have in the country where you live.
      </p>

      <h3>9. Supplementary rules</h3>
      <p>
        The <a href="/comunidade">Community Policy</a>, the{' '}
        <a href="/seguranca">Safety Guidance</a> and the{' '}
        <a href="/moderacao-e-denuncias">Moderation Policy</a> form part of
        these rules. In case of conflict, these Terms prevail.
      </p>
    </PaginaLegal>
  );
}
