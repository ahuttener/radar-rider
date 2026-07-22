import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // Inicializações a partir de localStorage, GPS e fetch pertencem a effects
    // neste PWA cliente. A regra nova do React 19 marca esses casos válidos.
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    files: ['app.js'],
    // A Hostinger inicia este arquivo como CommonJS por exigência do painel.
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
]);
