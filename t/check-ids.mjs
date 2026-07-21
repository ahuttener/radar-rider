// Confere se todo id usado no JS existe no HTML, e vice-versa.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
const js = readFileSync(root + 'app.js', 'utf8');
const html = readFileSync(root + 'index.html', 'utf8');

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
// $('x') e getElementById('x'); ignora 'screen-'+name, que é montado em runtime
const jsIds = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(m => m[1]));

// Criados em runtime (innerHTML do detalhe), então não estão no HTML estático.
const DYNAMIC = new Set(['detailBack']);
const missing = [...jsIds].filter(id => !htmlIds.has(id) && !DYNAMIC.has(id));
const unused = [...htmlIds].filter(id => !jsIds.has(id) && !/^screen-|^map$|^app$/.test(id));

// data-close / data-screen / data-tab / data-cat apontam para coisas reais?
const closes = [...html.matchAll(/data-close="([^"]+)"/g)].map(m => m[1]);
const badCloses = closes.filter(id => !htmlIds.has(id));
const screens = [...html.matchAll(/data-screen="([^"]+)"/g)].map(m => m[1]);
const badScreens = screens.filter(s => !htmlIds.has('screen-' + s));

console.log('ids no HTML:', htmlIds.size, '| ids usados no JS:', jsIds.size);
console.log('\nFALTANDO no HTML (o JS vai quebrar):', missing.length ? missing : 'nenhum');
console.log('data-close apontando para modal inexistente:', badCloses.length ? badCloses : 'nenhum');
console.log('data-screen sem tela correspondente:', badScreens.length ? badScreens : 'nenhum');
console.log('\nids no HTML que o JS nunca usa (ok se for só CSS/markup):', unused.length ? unused : 'nenhum');
process.exit(missing.length || badCloses.length || badScreens.length ? 1 : 0);
