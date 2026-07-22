import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/PaginaLegal';

export const metadata: Metadata = {
  title: 'Termos de Uso — Radar Rider',
  description: 'As regras do Radar Rider: o que é permitido publicar e o que o app não é.',
};

export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="22 de julho de 2026">
      <div className="privacy-box">
        <span>⚠️</span>
        <p>
          <b>O Radar Rider não é um serviço de emergência.</b> Em perigo
          imediato, ligue <b>999</b> ou <b>112</b>. O app não chama a polícia por
          você e ninguém do outro lado está de plantão lendo os alertas.
        </p>
      </div>

      <p>
        Ao usar o Radar Rider você concorda com estas regras. Elas são curtas de
        propósito.
      </p>

      <h3>1. O que o Radar Rider é</h3>
      <p>
        Um mural de avisos feito por entregadores, para entregadores, na Irlanda
        e no Reino Unido. Os alertas são publicados por outras pessoas da
        comunidade — <b>não são verificados por nós</b> e não são informação
        oficial de polícia. Trate cada alerta como o que ele é: o relato de um
        colega. Use o seu próprio julgamento antes de mudar de rota.
      </p>

      <h3>2. Sua conta</h3>
      <ul>
        <li>Você precisa ter 18 anos ou mais.</li>
        <li>Use um e-mail de verdade, que seja seu — é por ele que recuperamos sua senha.</li>
        <li>A senha é sua responsabilidade. Não empreste a conta.</li>
        <li>Seu nome público nunca aparece junto de um alerta.</li>
      </ul>

      <h3>3. O que você NÃO pode publicar</h3>
      <p>Esta é a parte que leva à remoção do alerta e à suspensão da conta:</p>
      <ul>
        <li>
          <b>Identificar pessoas.</b> Nada de nome, placa, foto, endereço,
          descrição de roupa ou qualquer coisa que aponte para uma pessoa
          específica. Descreva o <i>risco</i>, não o suspeito.
        </li>
        <li>
          <b>Descrição por raça, etnia, nacionalidade ou religião.</b> Um grupo
          não vira perigo por causa de quem é. Isso não é alerta de segurança, é
          discriminação, e é removido na hora.
        </li>
        <li><b>Alerta falso ou inventado.</b> Espalhar pânico prejudica quem está na rua.</li>
        <li><b>Convocação para retaliação, vingança ou justiça com as próprias mãos.</b></li>
        <li><b>Propaganda, venda, vaga de trabalho, corrente ou spam.</b></li>
        <li><b>Usar o app para seguir, vigiar ou intimidar alguém.</b></li>
      </ul>
      <p>
        Publique só o que você viu ou viveu, e só até 1 hora depois de
        acontecer. Alerta velho tira a atenção do que está acontecendo agora.
      </p>

      <h3>4. Confirmações e denúncias</h3>
      <p>
        Você só consegue confirmar um alerta se estiver perto dele. Confirmar
        algo que você não presenciou quebra a única coisa que separa o que é real
        do que é boato. Viu algo fora das regras? Use o botão de denúncia — é o
        caminho certo, e ele funciona.
      </p>

      <h3>5. Moderação</h3>
      <p>
        Podemos remover qualquer alerta e suspender ou encerrar qualquer conta
        que quebre estas regras, sem aviso prévio quando houver risco a alguém.
        Se você achar que erramos, escreva para{' '}
        <a href="mailto:contato@radarrider.com">contato@radarrider.com</a>.
      </p>

      <h3>6. Do que você continua dono</h3>
      <p>
        O texto que você publica continua sendo seu. Ao publicar, você nos dá
        permissão para exibi-lo dentro do Radar Rider para a comunidade. Nada
        mais — não revendemos e não licenciamos seu conteúdo para terceiros.
      </p>

      <h3>7. Limite da nossa responsabilidade</h3>
      <p>
        O Radar Rider é oferecido &quot;como está&quot;, gratuitamente e sem
        garantia de que estará no ar, correto ou completo. Não respondemos por
        prejuízo decorrente de um alerta impreciso, atrasado, ausente ou falso, e
        nem por decisões que você tomar com base nele. Nada aqui exclui
        responsabilidade que a lei não permite excluir — por morte, lesão
        corporal causada por negligência ou fraude, por exemplo.
      </p>

      <h3>8. Mudanças e lei aplicável</h3>
      <p>
        Podemos atualizar estes termos; a data no topo mostra a última versão, e
        mudanças relevantes são avisadas dentro do app. Estes termos são regidos
        pela lei da Irlanda, sem prejuízo dos direitos de consumidor que você
        tenha no país onde mora.
      </p>

      <h3>9. Regras complementares</h3>
      <p>
        A <a href="/comunidade">Política da Comunidade</a>, a{' '}
        <a href="/seguranca">Orientação de Segurança</a> e a{' '}
        <a href="/moderacao-e-denuncias">Política de Moderação</a> fazem parte
        destas regras. Em caso de conflito, estes Termos prevalecem.
      </p>
    </PaginaLegal>
  );
}
