import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { legalIdentity, PRIVACY_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Radar Rider',
  description: 'Que dados o Radar Rider guarda, por quê, por quanto tempo e como pedir a exclusão.',
};

export default function Privacidade() {
  const identity = legalIdentity();
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="22 de julho de 2026">
      <div className="privacy-box">
        <span>🛡️</span>
        <p>
          O resumo em uma frase: guardamos o mínimo para o app funcionar, a
          posição do seu alerta sai borrada no mapa e <b>seu nome nunca aparece
          junto de um alerta</b>.
        </p>
      </div>

      <h3>Quem é responsável</h3>
      <p>
        <b>{identity.name}</b>, estabelecido em {identity.address}, opera o Radar
        Rider como pessoa física e é o controlador dos dados. Para privacidade,
        escreva para <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>
      {identity.incomplete && (
        <div className="privacy-box">
          <span>⚠️</span><p>
            <b>Versão de pré-lançamento:</b> o nome civil e o endereço postal do
            controlador ainda precisam ser configurados antes do lançamento comercial.
          </p>
        </div>
      )}

      <h3>Que dados coletamos</h3>
      <ul>
        <li>
          <b>Sua conta:</b> nome público, e-mail e sua senha guardada de forma
          irreversível por hash (nem nós conseguimos lê-la).
        </li>
        <li>
          <b>Seus alertas:</b> categoria, descrição, quando aconteceu e a
          localização.
        </li>
        <li>
          <b>Sua localização:</b> só é lida quando você publica um alerta,
          confirma o alerta de outra pessoa ou toca em &quot;Minha
          localização&quot;. O app não te acompanha em segundo plano.
        </li>
        <li>
          <b>Confirmações e denúncias</b> que você faz sobre alertas de outras
          pessoas.
        </li>
        <li>
          <b>Dados técnicos:</b> endereço IP, navegador, aparelho e registros de
          erro ou segurança podem aparecer nos logs do provedor de hospedagem.
        </li>
      </ul>
      <p>
        Hoje não coletamos foto de perfil, imagens enviadas, lista de contatos,
        token de notificação push, dados de publicidade nem analytics. Se isso
        mudar, esta política e as escolhas de consentimento serão atualizadas antes.
      </p>

      <h3>O que acontece com a localização</h3>
      <p>
        Esta é a parte mais importante do app, então ela é explícita. Quando você
        publica um alerta, guardamos <b>duas</b> coordenadas:
      </p>
      <ul>
        <li>
          A <b>pública</b>, arredondada para uma área de mais ou menos 100
          metros. É a única que vai para o mapa, para o aplicativo e para
          qualquer outra pessoa.
        </li>
        <li>
          A <b>exata</b>, que fica guardada e <b>nunca sai numa resposta do
          site</b>. Ela existe só para a moderação conseguir agir quando alguém
          usa o app para perseguir ou intimidar outra pessoa, e para atender uma
          requisição legal da polícia.
        </li>
      </ul>
      <p>
        O borrão é feito no nosso servidor, não no seu celular. Isso impede que
        alguém adultere o aplicativo para publicar um alerta apontando para a
        porta da casa de outra pessoa.
      </p>

      <h3>Por que podemos usar esses dados</h3>
      <ul>
        <li>
          <b>Execução do contrato:</b> sua conta e seus alertas — sem eles, o app
          não tem como funcionar.
        </li>
        <li>
          <b>Consentimento:</b> a localização. O navegador pergunta antes, e você
          pode negar ou revogar nas configurações do aparelho a qualquer momento.
          Sem ela dá para ler o mapa, mas não dá para publicar nem confirmar.
        </li>
        <li>
          <b>Interesse legítimo:</b> moderação, prevenção de abuso e limite de
          publicações — manter o mapa confiável para a comunidade de
          entregadores.
        </li>
      </ul>

      <h3>Com quem compartilhamos</h3>
      <p>Não vendemos seus dados e não fazemos publicidade. Usamos apenas:</p>
      <ul>
        <li>
          <b>Hostinger</b> — hospedagem do site, do banco de dados e envio dos
          nossos e-mails (confirmação de conta e recuperação de senha).
        </li>
        <li>
          <b>CARTO e OpenStreetMap</b> — as imagens do mapa. Ao carregar o mapa,
          seu endereço de IP chega a esses serviços, como acontece com qualquer
          imagem que um site carrega.
        </li>
      </ul>
      <p>
        Também podemos entregar dados a autoridades quando formos legalmente
        obrigados a isso.
      </p>
      <p>
        O acesso interno é limitado ao operador e a moderadores autorizados,
        apenas quando necessário para suporte, segurança, moderação ou cumprimento
        de obrigação legal. Prestadores só tratam dados para executar o serviço.
      </p>

      <h3>Transferências internacionais</h3>
      <p>
        Alguns fornecedores de mapas ou infraestrutura podem tratar dados fora
        do Espaço Econômico Europeu. Quando aplicável, usamos as salvaguardas
        contratuais exigidas pelo RGPD e avaliamos o fornecedor antes do uso.
      </p>

      <h3>Por quanto tempo guardamos</h3>
      <ul>
        <li>
          <b>Alertas, confirmações e denúncias:</b> o alerta sai do mapa após 1 a
          12 horas e os registros são apagados em até 12 meses.
        </li>
        <li>
          <b>Conta:</b> enquanto ela existir. Na exclusão, removemos imediatamente
          os identificadores diretos e mantemos somente registros anonimizados
          necessários durante seus prazos de retenção.
        </li>
        <li>
          <b>Buy Me a Coffee:</b> somente se você tocar em “Apoiar”. O link abre
          o site externo, sujeito à política de privacidade própria dele.
        </li>
        <li><b>Tokens de e-mail:</b> até 30 dias depois de usados ou expirados.</li>
        <li><b>Ações de moderação:</b> até 12 meses.</li>
      </ul>

      <h3>Seus direitos</h3>
      <p>
        Pelo RGPD (e pelo UK GDPR, se você estiver no Reino Unido) você pode
        pedir: acesso aos seus dados, correção, exclusão, portabilidade,
        limitação do uso e oposição ao tratamento. Basta escrever para{' '}
        <a href="mailto:contato@radarrider.com">contato@radarrider.com</a> —
        normalmente respondemos em até um mês. Você também pode usar a página{' '}
        <a href="/rgpd">Seus direitos no RGPD</a>.
      </p>
      <p>
        Se você achar que tratamos seus dados de forma errada, pode reclamar à
        autoridade do seu país: a{' '}
        <a href="https://www.dataprotection.ie" target="_blank" rel="noopener">
          Data Protection Commission
        </a>{' '}
        na Irlanda, ou o{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener">ICO</a> no
        Reino Unido.
      </p>

      <h3>Idade mínima</h3>
      <p>
        O Radar Rider é somente para maiores de 18 anos. Não permitimos contas
        de crianças ou adolescentes e removemos contas identificadas como tal.
      </p>

      <h3>Decisões automatizadas e obrigação de fornecer dados</h3>
      <p>
        Não tomamos decisões com efeito jurídico exclusivamente por algoritmo.
        E-mail, nome público e senha são necessários para criar conta; GPS é
        opcional para consultar o mapa, mas necessário para publicar ou confirmar
        um alerta. Você pode negar a permissão do GPS no aparelho.
      </p>

      <h3>Mudanças nesta política</h3>
      <p>
        Se mudarmos algo relevante, atualizamos a data no topo desta página e
        avisamos dentro do app.
      </p>
    </PaginaLegal>
  );
}
