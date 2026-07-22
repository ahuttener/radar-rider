import { PaginaLegal } from './PaginaLegal';
import { LEGAL_UPDATED, PRIVACY_EMAIL, legalIdentity } from '@/lib/legal';

export type DocumentoLegal =
  | 'comunidade' | 'seguranca' | 'rgpd' | 'contato' | 'sobre'
  | 'denunciar-abuso' | 'moderacao' | 'retencao' | 'direitos-autorais'
  | 'autoridades' | 'seguranca-infantil' | 'uso-aceitavel' | 'responsabilidade';

export function DocumentoLegalPage({ documento }: { documento: DocumentoLegal }) {
  const email = <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;
  const identity = legalIdentity();

  if (documento === 'comunidade') return (
    <PaginaLegal titulo="Diretrizes da Comunidade" atualizadoEm={LEGAL_UPDATED}>
      <p>O Radar Rider existe para riders e ciclistas compartilharem riscos reais da via com respeito e responsabilidade.</p>
      <h3>O que esperamos</h3>
      <ul><li>Relate somente fatos que você presenciou e descreva o risco, não a pessoa.</li><li>Use linguagem objetiva e respeitosa.</li><li>Confirme apenas alertas próximos que você realmente verificou.</li><li>Denuncie conteúdo que viole estas regras.</li></ul>
      <h3>O que é proibido</h3>
      <ul><li>Alertas falsos, spam ou manipulação das confirmações.</li><li>Assédio, ameaça, discurso de ódio, discriminação ou ataque pessoal.</li><li>Expor nome, endereço, placa, imagem ou outros dados privados.</li><li>Incentivar violência, perseguição, retaliação ou atividade ilegal.</li><li>Conteúdo sexual, exploratório ou envolvendo menores.</li></ul>
      <p>Violações podem resultar em remoção imediata, limitação ou encerramento da conta e, quando a lei exigir, comunicação às autoridades.</p>
    </PaginaLegal>
  );

  if (documento === 'seguranca') return (
    <PaginaLegal titulo="Orientação e Aviso de Segurança" atualizadoEm={LEGAL_UPDATED}>
      <div className="privacy-box"><span>🚨</span><p><b>Em emergência, ligue 112 ou 999.</b> O Radar Rider não é monitorado continuamente e não substitui polícia, ambulância, bombeiros ou orientação profissional.</p></div>
      <h3>Use com segurança</h3>
      <ul><li>Nunca use o celular enquanto estiver pedalando ou conduzindo.</li><li>Pare em um local seguro antes de ler, confirmar ou publicar.</li><li>Use seu próprio julgamento e nunca dependa somente de um alerta.</li><li>Não se aproxime, confronte ou persiga pessoas por causa de um relato.</li><li>Obedeça às regras de trânsito e às instruções das autoridades.</li></ul>
      <p>Os alertas são enviados pela comunidade, podem estar imprecisos, atrasados, incompletos ou falsos.</p>
    </PaginaLegal>
  );

  if (documento === 'rgpd') return (
    <PaginaLegal titulo="Seus Direitos no RGPD" atualizadoEm={LEGAL_UPDATED}>
      <p>Você pode pedir acesso, correção, exclusão, restrição, portabilidade, retirada de consentimento e oposição ao tratamento, conforme as condições do RGPD.</p>
      <h3>Ferramentas imediatas</h3>
      <ul><li><a href="/api/account/export">Baixar uma cópia dos seus dados em JSON</a> (exige login).</li><li><a href="/excluir-conta">Excluir sua conta</a> (exige login e confirmação).</li></ul>
      <h3>Fazer um pedido</h3>
      <p>Escreva para {email} com o direito que deseja exercer. Podemos pedir informação mínima para confirmar sua identidade. Respondemos normalmente em até um mês.</p>
      <p>Você pode reclamar à <a href="https://www.dataprotection.ie" target="_blank" rel="noopener">Data Protection Commission da Irlanda</a>.</p>
    </PaginaLegal>
  );

  if (documento === 'contato') return (
    <PaginaLegal titulo="Contato" atualizadoEm={LEGAL_UPDATED}>
      <div className="privacy-box ok" style={{ display: 'block' }}>
        <p>
          O Radar Rider é novo e melhora todo dia. Encontrou um erro, algo
          estranho ou tem uma sugestão? Toda crítica é bem-vinda — fale com a
          gente: <b>{email}</b> 💙
        </p>
      </div>
      <h3>Suporte e privacidade</h3><p>{email}</p>
      <h3>Controlador dos dados</h3><p><b>{identity.name}</b><br />{identity.address}</p>
      <h3>Emergências</h3><p>Não envie emergências por e-mail. Na Irlanda e no Reino Unido, ligue 112 ou 999.</p>
    </PaginaLegal>
  );

  if (documento === 'sobre') return (
    <PaginaLegal titulo="Sobre o Radar Rider" atualizadoEm={LEGAL_UPDATED}>
      <p>O Radar Rider é uma plataforma comunitária independente para alertar entregadores e ciclistas sobre riscos na via. É operado por uma pessoa física estabelecida na Irlanda.</p>
      <p>O serviço não representa autoridades públicas, empresas de entrega ou plataformas de trabalho. O mapa usa relatos dos próprios usuários e posições aproximadas para reduzir riscos de identificação.</p>
      <p>O app é gratuito e independente. Quem quiser pode apoiar voluntariamente pelo botão “Apoiar”; o pagamento acontece fora do Radar Rider, no Buy Me a Coffee.</p>
      <p>Contato: {email}</p>
    </PaginaLegal>
  );

  if (documento === 'denunciar-abuso') return (
    <PaginaLegal titulo="Denunciar Abuso" atualizadoEm={LEGAL_UPDATED}>
      <p>No detalhe de qualquer alerta ativo, toque em <b>Denunciar este alerta</b>, escolha o motivo e acrescente contexto. É necessário estar conectado.</p>
      <h3>Denúncia por e-mail</h3><p>Se não conseguir usar o botão, escreva para {email} com o horário, área aproximada, descrição e motivo. Não envie dados pessoais desnecessários.</p>
      <h3>Risco imediato</h3><p>Para perigo ou crime em andamento, use 112 ou 999. Uma denúncia ao Radar Rider não é uma denúncia policial.</p>
    </PaginaLegal>
  );

  if (documento === 'moderacao') return (
    <PaginaLegal titulo="Política de Denúncias e Moderação" atualizadoEm={LEGAL_UPDATED}>
      <p>Denúncias entram numa fila restrita a moderadores e administradores. Avaliamos o conteúdo, o motivo, o contexto, o histórico e o risco de dano.</p>
      <h3>Possíveis medidas</h3><ul><li>Manter o alerta, colocá-lo em análise, ocultá-lo ou removê-lo.</li><li>Orientar, limitar, suspender ou encerrar a conta responsável.</li><li>Preservar registros ou comunicar autoridades quando houver obrigação legal.</li></ul>
      <p>Conteúdo que exponha alguém, ameace violência, envolva exploração infantil ou crie risco imediato pode ser removido sem aviso. Para contestar uma decisão, escreva para {email}.</p>
    </PaginaLegal>
  );

  if (documento === 'retencao') return (
    <PaginaLegal titulo="Política de Retenção de Dados" atualizadoEm={LEGAL_UPDATED}>
      <table className="legal-table"><thead><tr><th>Dado</th><th>Prazo</th></tr></thead><tbody>
        <tr><td>Conta</td><td>Até a exclusão solicitada pelo usuário.</td></tr><tr><td>Alertas, confirmações e denúncias</td><td>Até 12 meses.</td></tr><tr><td>Tokens de confirmação e senha</td><td>Até 30 dias após uso ou expiração.</td></tr><tr><td>Ações de moderação</td><td>Até 12 meses.</td></tr><tr><td>Logs do provedor</td><td>Conforme configuração operacional e necessidade de segurança, pelo menor prazo razoável.</td></tr>
      </tbody></table>
      <p>Na exclusão da conta, identificadores diretos são removidos imediatamente. Registros anonimizados podem permanecer até o fim do prazo aplicável ou quando a lei exigir preservação.</p>
    </PaginaLegal>
  );

  if (documento === 'direitos-autorais') return (
    <PaginaLegal titulo="Política de Direitos Autorais" atualizadoEm={LEGAL_UPDATED}>
      <p>Publique apenas texto que você criou ou tem direito de compartilhar. Ao publicar, você concede ao Radar Rider uma licença não exclusiva e limitada para exibir e moderar o conteúdo dentro do serviço.</p>
      <p>Para reclamar de violação, escreva para {email} informando a obra, o conteúdo denunciado, onde aparece, seus dados de contato e uma declaração de boa-fé. Podemos remover o conteúdo e pedir comprovação adicional.</p>
    </PaginaLegal>
  );

  if (documento === 'autoridades') return (
    <PaginaLegal titulo="Pedidos de Autoridades" atualizadoEm={LEGAL_UPDATED}>
      <p>Autoridades devem enviar pedidos oficiais para {email}, identificando órgão, agente, fundamento legal, dados procurados, período e forma segura de resposta.</p>
      <p>Verificamos validade, competência, necessidade e proporcionalidade. Podemos contestar pedidos excessivos e avisar o usuário quando a lei permitir. Pedidos emergenciais devem explicar o risco concreto e imediato; esta caixa não substitui os canais oficiais de emergência.</p>
    </PaginaLegal>
  );

  if (documento === 'seguranca-infantil') return (
    <PaginaLegal titulo="Política de Segurança Infantil" atualizadoEm={LEGAL_UPDATED}>
      <p>O Radar Rider é exclusivo para pessoas com 18 anos ou mais. Não permitimos contas de menores nem conteúdo que explore, sexualize, ameace ou exponha crianças e adolescentes.</p>
      <p>Conteúdo suspeito é removido com prioridade e pode ser preservado e comunicado às autoridades competentes quando a lei exigir. Denuncie pelo botão do alerta ou por {email}; em perigo imediato, ligue 112 ou 999.</p>
    </PaginaLegal>
  );

  if (documento === 'uso-aceitavel') return (
    <PaginaLegal titulo="Política de Uso Aceitável" atualizadoEm={LEGAL_UPDATED}>
      <ul><li>Não tente acessar contas, dados, APIs ou áreas administrativas sem autorização.</li><li>Não automatize spam, raspagem, sobrecarga, engenharia reversa abusiva ou evasão de limites.</li><li>Não publique malware, fraude, conteúdo ilegal ou instruções para prejudicar alguém.</li><li>Não use alertas para discriminar, perseguir, vigiar ou coordenar retaliação.</li></ul>
      <p>Podemos bloquear tráfego, remover conteúdo e encerrar contas para proteger usuários e o serviço.</p>
    </PaginaLegal>
  );

  return (
    <PaginaLegal titulo="Aviso e Limitação de Responsabilidade" atualizadoEm={LEGAL_UPDATED}>
      <p>O Radar Rider compartilha informação comunitária e não garante que alertas sejam corretos, completos, atuais ou disponíveis. Você continua responsável por sua rota, sua condução e suas decisões.</p>
      <p>Na extensão permitida pela lei irlandesa, não respondemos por perdas indiretas decorrentes de confiança em alerta comunitário ou indisponibilidade. Nada exclui responsabilidade que não possa ser limitada por lei, incluindo fraude e morte ou lesão causadas por negligência.</p>
      <p>Não use o app em movimento e, em emergência, ligue 112 ou 999.</p>
    </PaginaLegal>
  );
}
