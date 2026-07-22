import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';

export const metadata: Metadata = {
  title: 'Política de Cookies — Radar Rider',
  description: 'Quais cookies o Radar Rider usa. Não usamos rastreamento nem publicidade.',
};

export default function Cookies() {
  return (
    <PaginaLegal titulo="Política de Cookies" atualizadoEm="22 de julho de 2026">
      <div className="privacy-box ok" style={{ display: 'block' }}>
        <p>
          <b>O Radar Rider não usa cookie de rastreamento, de publicidade nem de
          estatística.</b> Só os que fazem o app funcionar. Não há nada para
          você desativar aqui, e é por isso que não te enchemos com um painel de
          escolhas.
        </p>
      </div>

      <h3>O que é um cookie</h3>
      <p>
        É um arquivinho que o site guarda no seu navegador para lembrar de algo
        entre uma página e outra — por exemplo, que você já entrou na sua conta.
      </p>

      <h3>Os que usamos</h3>

      <table className="legal-table">
        <thead>
          <tr><th>Nome</th><th>Para que serve</th><th>Dura</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>__Secure-next-auth.session-token</code></td>
            <td>Mantém você conectado na sua conta. Sem ele, você teria que
                entrar de novo a cada página.</td>
            <td>30 dias</td>
          </tr>
          <tr>
            <td><code>__Host-next-auth.csrf-token</code></td>
            <td>Segurança: impede que outro site consiga enviar formulários em
                seu nome.</td>
            <td>Sessão</td>
          </tr>
          <tr>
            <td><code>__Secure-next-auth.callback-url</code></td>
            <td>Lembra para qual tela te levar depois do login.</td>
            <td>Sessão</td>
          </tr>
        </tbody>
      </table>

      <p>
        Em ambiente local ou sem HTTPS, os prefixos <code>__Secure-</code> e{' '}
        <code>__Host-</code> podem não aparecer. A finalidade não muda.
      </p>

      <p>
        Todos são <b>estritamente necessários</b>. Pela lei europeia de
        ePrivacy, cookies dessa natureza não dependem de consentimento — o que
        depende é o cookie de análise e de anúncio, que nós não usamos.
      </p>

      <h3>O que guardamos no seu aparelho fora dos cookies</h3>
      <p>
        O app também usa o armazenamento local do navegador para duas
        preferências suas. Elas nunca saem do seu aparelho e não chegam a nós:
      </p>
      <ul>
        <li><code>rr-aviso-cookies</code> — lembra que você já fechou o aviso de cookies.</li>
        <li><code>rr-pais</code> — lembra se você estava vendo a Irlanda ou o Reino Unido.</li>
      </ul>

      <h3>Como apagar</h3>
      <p>
        Nas configurações do seu navegador, em &quot;Privacidade&quot; ou
        &quot;Dados de navegação&quot;. Se apagar, você sai da sua conta e as
        preferências acima voltam ao padrão — nada além disso se perde.
      </p>

      <h3>Link de apoio</h3>
      <p>
        O botão “Apoiar” é apenas um link. O Buy Me a Coffee não carrega código
        nem grava cookies dentro do Radar Rider. Ao abrir o site externo, passam
        a valer as escolhas e a política de cookies daquele serviço.
      </p>

      <h3>Dúvidas</h3>
      <p>
        Escreva para{' '}
        <a href="mailto:contato@radarrider.com">contato@radarrider.com</a>. Veja
        também a nossa política de privacidade para entender o que fazemos com
        os dados da sua conta e dos seus alertas.
      </p>
    </PaginaLegal>
  );
}
