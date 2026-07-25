import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { PRIVACY_EMAIL, LEGAL_UPDATED } from '@/lib/legal';

// Versão PRINCIPAL (português) da política de cookies. A equivalente em inglês
// está em /cookie-policy. As duas dizem a mesma coisa.

export const metadata: Metadata = {
  title: 'Política de Cookies — Radar Rider',
  description: 'Quais cookies o Radar Rider usa. Não usamos rastreamento nem publicidade.',
  alternates: {
    canonical: '/cookies',
    languages: { 'pt-BR': '/cookies', en: '/cookie-policy' },
  },
};

export default function Cookies() {
  return (
    <PaginaLegal
      titulo="Política de Cookies"
      atualizadoEm={LEGAL_UPDATED}
      versaoEm="/cookie-policy"
    >
      <div className="privacy-box ok" style={{ display: 'block' }}>
        <p>
          <b>O Radar Rider não usa nenhum cookie de rastreamento, publicidade ou
          analytics.</b>{' '}
          Só os que fazem o app funcionar. Não há nada aqui para você desligar,
          e é por isso que não enterramos você num painel de escolhas.
        </p>
      </div>

      <h3>O que é um cookie</h3>
      <p>
        Um arquivinho que o site guarda no seu navegador para lembrar de algo de
        uma página para a outra — por exemplo, que você já entrou na sua conta.
      </p>

      <h3>Os que usamos</h3>

      <table className="legal-table">
        <thead>
          <tr><th>Nome</th><th>Para que serve</th><th>Dura</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>__Secure-next-auth.session-token</code></td>
            <td>Mantém você conectado à sua conta. Sem ele, você teria que
                entrar de novo a cada página.</td>
            <td>30 dias</td>
          </tr>
          <tr>
            <td><code>__Host-next-auth.csrf-token</code></td>
            <td>Segurança: impede que outro site envie formulários em seu
                nome.</td>
            <td>Sessão</td>
          </tr>
          <tr>
            <td><code>__Secure-next-auth.callback-url</code></td>
            <td>Lembra para qual tela levar você depois de entrar.</td>
            <td>Sessão</td>
          </tr>
        </tbody>
      </table>

      <p>
        Localmente ou sem HTTPS, os prefixos <code>__Secure-</code> e{' '}
        <code>__Host-</code> podem não aparecer. A finalidade continua a mesma.
      </p>

      <p>
        Todos eles são <b>estritamente necessários</b>. Pelas regras de
        ePrivacy da União Europeia — e, no Reino Unido, pelo Privacy and
        Electronic Communications Regulations (PECR) — cookies desse tipo não
        exigem consentimento. O que exige consentimento são cookies de analytics
        e de publicidade, que nós não usamos.
      </p>

      <h3>O que guardamos no seu aparelho fora dos cookies</h3>
      <p>
        O app também usa o armazenamento local do seu navegador para duas
        preferências suas. Elas nunca saem do seu aparelho e nunca chegam até
        nós:
      </p>
      <ul>
        <li><code>rr-aviso-cookies</code> — lembra que você já fechou o aviso de cookies.</li>
        <li><code>rr-pais</code> — lembra se você estava vendo a Irlanda ou o Reino Unido.</li>
      </ul>

      <h3>Como apagar</h3>
      <p>
        Nas configurações do seu navegador, em &quot;Privacidade&quot; ou
        &quot;Dados de navegação&quot;. Se você apagar, sai da conta e as
        preferências acima voltam ao padrão — nada além disso se perde.
      </p>

      <h3>Link de apoio</h3>
      <p>
        O botão &quot;Apoiar&quot; é apenas um link. O Buy Me a Coffee não
        carrega código nem guarda cookies dentro do Radar Rider. Quando você
        abre o site externo, valem as escolhas e a política de cookies do
        serviço deles.
      </p>

      <h3>Dúvidas</h3>
      <p>
        Escreva para <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        Veja também a nossa{' '}
        <a href="/privacidade">política de privacidade</a> para entender o que
        fazemos com os dados da sua conta e dos alertas.
      </p>
    </PaginaLegal>
  );
}
