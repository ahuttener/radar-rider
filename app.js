// Ponto de entrada da aplicação na Hostinger.
//
// O painel não tem campo de "comando de início": ele executa `node app.js`.
// Como o Next.js normalmente sobe com `next start`, este arquivo faz o mesmo
// por dentro — cria o servidor HTTP e entrega as requisições para o Next.
//
// CommonJS de propósito: o package.json não declara "type": "module", então
// `import` aqui quebraria na inicialização.

const { createServer } = require('node:http');
const next = require('next');

// O painel da Hostinger ESCAPA o `%` ao injetar as variáveis no processo: a
// senha do banco vai para o ambiente como `...\%40...` em vez de `...%40...`.
// Como src/lib/prisma.ts faz decodeURIComponent na senha, a barra sobrevive e
// o MySQL recusa com ER_ACCESS_DENIED — derrubando TODA rota que toque o banco,
// inclusive criar conta e entrar. Medido comparando o `.env` (sem barra) com
// /proc/<pid>/environ (com barra).
//
// Desfazer isso aqui é seguro porque `\` não tem significado numa URL de
// conexão: só se remove a barra que estiver imediatamente antes de um `%`,
// que é exatamente o estrago do painel. Uma senha legítima com `\` literal
// teria de vir como `%5C`, e essa forma não é tocada.
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('\\%')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/\\(?=%)/g, '');
  console.log('DATABASE_URL: desfeito o escape de % inserido pelo painel.');
}

// A porta vem da plataforma. Fixar 3000 faria o processo subir na porta errada
// e o proxy continuaria sem achar ninguém — que é o 503 que estávamos vendo.
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

// Quanto esperar as requisições em curso terminarem antes de sair à força.
// Sem esse teto, uma única conexão pendurada mantém o processo vivo para
// sempre — que é exatamente o problema que este desligamento existe para
// resolver.
const ESPERA_MAXIMA_MS = 10_000;

app
  .prepare()
  .then(() => {
    const servidor = createServer((req, res) => {
      handle(req, res).catch((erro) => {
        console.error('Falha ao atender a requisição:', erro);
        res.statusCode = 500;
        res.end('Erro interno.');
      });
    });

    servidor.listen(port, hostname, () => {
      console.log(`Radar Rider no ar em http://${hostname}:${port}`);
    });

    // Sem isto o processo antigo NÃO morre quando o Passenger sobe uma
    // instância nova: ele fica vivo segurando ~300 MB e o orçamento de
    // processos da jaula CloudLinux, até a hospedagem recusar conexão nova
    // (o SSH cai na hora, e o painel acusa uso alto de recursos em 24h com
    // todas as métricas instantâneas no chão).
    let desligando = false;
    for (const sinal of ['SIGTERM', 'SIGINT']) {
      process.on(sinal, () => {
        // Passenger manda SIGTERM mais de uma vez; sem esta trava o segundo
        // sinal reinicia a contagem e o processo demora ainda mais a sair.
        if (desligando) return;
        desligando = true;
        console.log(`Recebi ${sinal}, encerrando.`);

        const forcar = setTimeout(() => {
          console.error('Requisições não terminaram a tempo, saindo à força.');
          process.exit(0);
        }, ESPERA_MAXIMA_MS);
        // O timer não pode ser o único motivo de o processo continuar vivo.
        forcar.unref();

        servidor.close(async () => {
          clearTimeout(forcar);
          // Fechar só o servidor HTTP não basta: quem fica órfão comendo
          // memória são os `next-server`, que são recursos do Next, não deste
          // arquivo. `app.close()` é o que os derruba junto.
          try {
            await app.close();
          } catch (erro) {
            console.error('Falha ao encerrar o Next:', erro);
          }
          process.exit(0);
        });

        // `close()` para de aceitar conexão nova e espera as abertas fecharem.
        // O proxy mantém conexão keep-alive ociosa aberta por minutos; estas
        // são derrubadas na hora porque não há nada em curso nelas.
        // Deliberadamente NÃO se usa `closeAllConnections()`: aquele mata
        // também a requisição em andamento, ou seja, corta a resposta de quem
        // está no meio de um cadastro. Requisição travada é problema do teto
        // acima, não deste desligamento.
        servidor.closeIdleConnections();
      });
    }
  })
  .catch((erro) => {
    // Sair com código diferente de zero para a plataforma perceber que o
    // processo não subiu, em vez de marcar como saudável um app quebrado.
    console.error('Não foi possível iniciar o Next.js:', erro);
    process.exit(1);
  });
