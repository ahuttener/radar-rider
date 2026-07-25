import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { legalIdentity, PRIVACY_EMAIL, LEGAL_UPDATED } from '@/lib/legal';

// Versão PRINCIPAL (português) da política de privacidade. A equivalente em
// inglês está em /privacy. As duas dizem a mesma coisa — ao mudar uma, mudar
// a outra.

export const metadata: Metadata = {
  title: 'Política de Privacidade — Radar Rider',
  description: 'Que dados o Radar Rider guarda, por quê, por quanto tempo e como pedir a exclusão.',
  alternates: {
    canonical: '/privacidade',
    languages: { 'pt-BR': '/privacidade', en: '/privacy' },
  },
};

export default function Privacidade() {
  const identity = legalIdentity();
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      atualizadoEm={LEGAL_UPDATED}
      versaoEm="/privacy"
    >
      <div className="privacy-box">
        <span>🛡️</span>
        <p>
          O resumo em uma frase: guardamos o mínimo necessário para o app
          funcionar, a posição do seu alerta sai borrada no mapa e{' '}
          <b>o seu nome nunca aparece ao lado de um alerta</b>.
        </p>
      </div>

      <h3>Quem é o responsável</h3>
      <p>
        <b>{identity.name}</b> opera o Radar Rider como pessoa física e é o
        controlador dos dados{identity.address ? `, com sede em ${identity.address}` : ', estabelecido na Irlanda'}.
        O contato oficial para qualquer assunto de privacidade — acesso,
        correção, exclusão ou reclamações — é{' '}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>, uma caixa de
        e-mail monitorada.
      </p>
      {identity.incomplete && (
        <div className="privacy-box">
          <span>⚠️</span><p>
            <b>Versão pré-lançamento:</b> o nome legal do controlador ainda
            precisa ser configurado antes do lançamento comercial.
          </p>
        </div>
      )}

      <h3>Que dados coletamos</h3>
      <ul>
        <li>
          <b>Sua conta:</b> nome público, e-mail, telefone e a sua senha
          guardada de forma irreversível como hash (nem nós conseguimos lê-la).
        </li>
        <li>
          <b>Seus alertas:</b> categoria, descrição, quando aconteceu e o local.
        </li>
        <li>
          <b>Sua localização:</b> lida apenas quando você publica um alerta,
          confirma o alerta de outra pessoa ou toca em &quot;Minha
          localização&quot;. O app não rastreia você em segundo plano.
        </li>
        <li>
          <b>Confirmações e denúncias</b> que você faz sobre alertas de outras
          pessoas.
        </li>
        <li>
          <b>Notificações push:</b> se você ativar, guardamos a inscrição do seu
          navegador e o país escolhido (Irlanda ou Reino Unido), para avisar
          sobre alertas naquele país. Você pode desativar quando quiser.
        </li>
        <li>
          <b>Dados técnicos:</b> endereço IP, navegador, aparelho e registros de
          erro ou segurança podem aparecer nos logs da hospedagem.
        </li>
        <li>
          <b>Contagem de instalações:</b> quando o app é instalado no aparelho,
          registramos apenas <b>a data e o país</b> — para sabermos quantas
          instalações houve. Não guardamos quem instalou, nem identificador do
          aparelho: não há como ligar esse número a você.
        </li>
      </ul>
      <p>
        Hoje não coletamos foto de perfil, imagens enviadas, lista de contatos,
        dados de publicidade nem analytics. Se isso mudar, esta política e as
        opções de consentimento serão atualizadas antes.
      </p>

      <h3>O que acontece com a sua localização</h3>
      <p>
        Esta é a parte mais importante do app, então fica explicada em detalhe.
        Quando você publica um alerta, guardamos <b>duas</b> coordenadas:
      </p>
      <ul>
        <li>
          A <b>pública</b>, arredondada para uma área de cerca de 100 metros. É
          a única que vai para o mapa, para o app e para qualquer outra pessoa.
        </li>
        <li>
          A <b>exata</b>, que fica armazenada e <b>nunca sai do site em uma
          resposta</b>. Ela existe só para a moderação poder agir quando alguém
          usa o app para perseguir ou intimidar outra pessoa, e para atender a
          um pedido legal da polícia. É apagada 7 dias depois de o alerta sair
          do mapa.
        </li>
      </ul>
      <p>
        O borrão é feito no nosso servidor, e não no seu celular. Isso impede
        que alguém adultere o app para publicar um alerta apontando para a porta
        da casa de outra pessoa.
      </p>

      <h3>Por que podemos usar esses dados</h3>
      <ul>
        <li>
          <b>Execução de contrato:</b> a sua conta e os seus alertas — sem eles
          o app não funciona.
        </li>
        <li>
          <b>Consentimento:</b> a sua localização e as notificações push. O
          navegador pergunta antes, e você pode recusar ou revogar qualquer uma
          delas nas configurações do aparelho a qualquer momento. Sem a
          localização você consegue ler o mapa, mas não publicar nem confirmar.
        </li>
        <li>
          <b>Interesse legítimo:</b> moderação, prevenção de abuso e limites de
          publicação — manter o mapa confiável para a comunidade de entregadores.
        </li>
      </ul>

      <h3>Com quem compartilhamos</h3>
      <p>Não vendemos os seus dados e não veiculamos publicidade. Usamos apenas:</p>
      <ul>
        <li>
          <b>Hostinger</b> — hospedagem do site, do banco de dados e envio dos
          nossos e-mails (confirmação de conta e recuperação de senha).
        </li>
        <li>
          <b>CARTO e OpenStreetMap</b> — as imagens do mapa. Quando o mapa
          carrega, o seu endereço IP chega a esses serviços, como acontece com
          qualquer imagem que um site carrega.
        </li>
        <li>
          <b>O serviço de push do seu navegador</b> (Google ou Mozilla, por
          exemplo) — só se você ativar as notificações. É ele que entrega a
          mensagem no seu aparelho.
        </li>
      </ul>
      <p>
        Também podemos divulgar dados a autoridades quando somos legalmente
        obrigados a fazê-lo.
      </p>
      <p>
        O acesso interno é limitado ao operador e a moderadores autorizados,
        apenas quando necessário para suporte, segurança, moderação ou
        cumprimento de obrigação legal. Os fornecedores tratam os dados somente
        para prestar o serviço deles.
      </p>

      <h3>Transferências internacionais</h3>
      <p>
        Alguns fornecedores de mapa ou de infraestrutura podem tratar dados fora
        do Espaço Económico Europeu ou do Reino Unido. Quando aplicável,
        apoiamo-nos nas salvaguardas de transferência exigidas pelo RGPD e pelo
        UK GDPR — como as Cláusulas Contratuais-Tipo, com o adendo do Reino
        Unido quando for o caso — e avaliamos o fornecedor antes de usar.
      </p>

      <h3>Por quanto tempo guardamos</h3>
      <ul>
        <li>
          <b>Alertas, confirmações e denúncias:</b> o alerta sai do mapa depois
          de 1 a 12 horas, a localização exata é apagada 7 dias depois, e os
          registros são excluídos em até 12 meses.
        </li>
        <li>
          <b>Conta:</b> enquanto ela existir. Na exclusão, removemos
          imediatamente os identificadores diretos — inclusive o seu telefone —
          e mantemos apenas registros anonimizados pelo prazo de retenção deles.
        </li>
        <li>
          <b>Buy Me a Coffee:</b> só se você tocar em &quot;Apoiar&quot;. O link
          abre o site externo, sujeito à política de privacidade dele.
        </li>
        <li>
          <b>Tokens de e-mail:</b> até 30 dias depois de usados ou expirados.
        </li>
        <li><b>Ações de moderação:</b> até 12 meses.</li>
      </ul>

      <h3>Os seus direitos</h3>
      <p>
        Pelo RGPD (e pelo UK GDPR, se você estiver no Reino Unido) você pode
        pedir: acesso aos seus dados, correção, exclusão, portabilidade,
        limitação do uso e oposição ao tratamento. Quando o tratamento se apoia
        no consentimento, você pode retirá-lo a qualquer momento, sem afetar o
        que já foi feito antes. É só escrever para{' '}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> — normalmente
        respondemos em até um mês. Você também pode usar a página{' '}
        <a href="/rgpd">Os seus direitos RGPD</a>.
      </p>
      <p>
        Se você acredita que tratamos os seus dados de forma errada, pode
        reclamar à autoridade do seu país: a{' '}
        <a href="https://www.dataprotection.ie" target="_blank" rel="noopener">
          Data Protection Commission
        </a>{' '}
        na Irlanda, ou o{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noopener">
          Information Commissioner&apos;s Office (ICO)
        </a>{' '}
        no Reino Unido.
      </p>

      <h3>Idade mínima</h3>
      <p>
        O Radar Rider é apenas para adultos com 18 anos ou mais. Não permitimos
        contas de crianças ou adolescentes e removemos qualquer conta
        identificada como tal.
      </p>

      <h3>Decisões automatizadas e obrigação de fornecer dados</h3>
      <p>
        Não tomamos decisões com efeito jurídico apenas por algoritmo. E-mail,
        nome público, telefone e senha são necessários para criar uma conta; o
        GPS é opcional para ver o mapa, mas necessário para publicar ou
        confirmar um alerta. Você pode recusar a permissão de GPS no seu
        aparelho.
      </p>

      <h3>Mudanças nesta política</h3>
      <p>
        Se mudarmos algo relevante, atualizamos a data no topo desta página e
        avisamos dentro do app.
      </p>
    </PaginaLegal>
  );
}
