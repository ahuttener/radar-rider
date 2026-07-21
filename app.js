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

// A porta vem da plataforma. Fixar 3000 faria o processo subir na porta errada
// e o proxy continuaria sem achar ninguém — que é o 503 que estávamos vendo.
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res).catch((erro) => {
        console.error('Falha ao atender a requisição:', erro);
        res.statusCode = 500;
        res.end('Erro interno.');
      });
    }).listen(port, hostname, () => {
      console.log(`Radar Rider no ar em http://${hostname}:${port}`);
    });
  })
  .catch((erro) => {
    // Sair com código diferente de zero para a plataforma perceber que o
    // processo não subiu, em vez de marcar como saudável um app quebrado.
    console.error('Não foi possível iniciar o Next.js:', erro);
    process.exit(1);
  });
