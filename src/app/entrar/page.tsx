import TelaEntrada from '@/components/TelaEntrada';

// A rota /entrar continua existindo — é para onde aponta o link do e-mail de
// confirmação e o "esqueci a senha". Mostra a mesma tela que a home exibe para
// quem não está logado.
export default function Entrar() {
  return <TelaEntrada />;
}
