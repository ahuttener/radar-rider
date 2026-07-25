import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';
import { PRIVACY_EMAIL, LEGAL_UPDATED } from '@/lib/legal';

// Versão PRINCIPAL (português) dos termos de uso. A equivalente em inglês está
// em /terms. As duas dizem a mesma coisa — ao mudar uma, mudar a outra.

export const metadata: Metadata = {
  title: 'Termos de Uso — Radar Rider',
  description: 'As regras do Radar Rider: o que você pode publicar e o que o app não é.',
  alternates: {
    canonical: '/termos',
    languages: { 'pt-BR': '/termos', en: '/terms' },
  },
};

export default function Termos() {
  return (
    <PaginaLegal
      titulo="Termos de Uso"
      atualizadoEm={LEGAL_UPDATED}
      versaoEm="/terms"
    >
      <div className="privacy-box">
        <span>⚠️</span>
        <p>
          <b>O Radar Rider não é um serviço de emergência.</b> Em perigo
          imediato, ligue <b>999</b> ou <b>112</b> — os dois funcionam na
          Irlanda e no Reino Unido. O app não chama a polícia por você, e não há
          ninguém de plantão do outro lado lendo os alertas.
        </p>
      </div>

      <p>
        Ao usar o Radar Rider você concorda com estas regras. Elas são curtas de
        propósito.
      </p>

      <h3>1. O que o Radar Rider é</h3>
      <p>
        Um mural feito por entregadores, para entregadores, na Irlanda e no
        Reino Unido. Os alertas são publicados por outras pessoas da comunidade
        — <b>eles não são verificados por nós</b> e não são informação oficial
        da polícia. Trate cada alerta pelo que ele é: o relato de um colega. Use
        o seu próprio julgamento antes de mudar de rota.
      </p>

      <h3>2. A sua conta</h3>
      <ul>
        <li>Você precisa ter 18 anos ou mais.</li>
        <li>
          Use um e-mail real e seu — é por ele que recuperamos a sua senha.
        </li>
        <li>
          A sua senha é responsabilidade sua. Não compartilhe a sua conta.
        </li>
        <li>O seu nome público nunca aparece ao lado de um alerta.</li>
      </ul>

      <h3>3. O que você NÃO pode publicar</h3>
      <p>
        Esta é a parte que leva um alerta a ser removido e uma conta a ser
        suspensa:
      </p>
      <ul>
        <li>
          <b>Identificar pessoas.</b> Nada de nomes, placas, fotos, endereços,
          descrição de roupa ou qualquer coisa que aponte para uma pessoa
          específica. Descreva o <i>risco</i>, não o suspeito.
        </li>
        <li>
          <b>Descrições por raça, etnia, nacionalidade ou religião.</b> Um grupo
          não vira perigo por causa de quem é. Isso não é alerta de segurança, é
          discriminação, e é removido imediatamente.
        </li>
        <li>
          <b>Alertas falsos ou inventados.</b> Espalhar pânico prejudica quem
          está na rua.
        </li>
        <li><b>Convocação de retaliação, vingança ou justiça com as próprias mãos.</b></li>
        <li><b>Publicidade, vendas, vagas de emprego, correntes ou spam.</b></li>
        <li><b>Usar o app para seguir, vigiar ou intimidar alguém.</b></li>
      </ul>
      <p>
        Publique só o que você viu ou viveu, e apenas até 1 hora depois de ter
        acontecido. Um alerta velho tira a atenção do que está acontecendo agora.
      </p>

      <h3>4. Confirmações e denúncias</h3>
      <p>
        Você só pode confirmar um alerta se estiver perto dele. Confirmar algo
        que você não presenciou quebra a única coisa que separa o que é real do
        boato. Viu algo contra as regras? Use o botão de denúncia — é o caminho
        certo, e ele funciona.
      </p>

      <h3>5. Moderação</h3>
      <p>
        Podemos remover qualquer alerta e suspender ou encerrar qualquer conta
        que descumpra estas regras, sem aviso prévio quando alguém estiver em
        risco. Se você acha que erramos, escreva para{' '}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>

      <h3>6. O que continua seu</h3>
      <p>
        O texto que você publica continua sendo seu. Ao publicar, você nos dá
        permissão para exibi-lo dentro do Radar Rider para a comunidade. Nada
        além disso — não revendemos e não licenciamos o seu conteúdo a
        terceiros.
      </p>

      <h3>7. Limite da nossa responsabilidade</h3>
      <p>
        O Radar Rider é fornecido &quot;como está&quot;, de graça e sem garantia
        de que estará disponível, correto ou completo. Não somos responsáveis
        por prejuízo decorrente de alerta impreciso, atrasado, ausente ou falso,
        nem por decisões que você tome com base em um deles. Nada aqui exclui a
        responsabilidade que a lei não permite excluir — por morte ou dano
        pessoal causado por negligência, ou por fraude, por exemplo.
      </p>

      <h3>8. Mudanças e lei aplicável</h3>
      <p>
        Podemos atualizar estes termos; a data no topo mostra a versão mais
        recente, e mudanças relevantes são anunciadas dentro do app. Estes
        termos são regidos pela lei da Irlanda. Se você mora no Reino Unido ou
        em outro país, isso não retira as proteções obrigatórias do consumidor
        do lugar onde você vive, e você continua podendo recorrer aos tribunais
        locais.
      </p>

      <h3>9. Regras complementares</h3>
      <p>
        A <a href="/comunidade">Política da Comunidade</a>, o{' '}
        <a href="/seguranca">Guia de Segurança</a> e a{' '}
        <a href="/moderacao-e-denuncias">Política de Moderação</a> fazem parte
        destas regras. Em caso de conflito, prevalecem estes Termos.
      </p>
    </PaginaLegal>
  );
}
