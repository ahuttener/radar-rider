RADAR RIDER — PASSOS FINAIS PARA PUBLICAR

1) Crie um projeto gratuito em Supabase.
2) No SQL Editor, cole e execute todo o arquivo supabase.sql.
3) Em Project Settings > API, copie:
   - Project URL
   - Publishable key (não use secret/service_role)
4) Duplique config.example.js, renomeie a cópia para config.js e preencha os dois valores.
5) Em Authentication > URL Configuration:
   Site URL: https://radarrider.com
   Redirect URLs: https://radarrider.com/**
6) Em Authentication > Providers, mantenha Email ativado e exija confirmação por e-mail.
7) Configure SMTP próprio antes do lançamento público.
8) Faça seu primeiro cadastro no site.
9) No SQL Editor, execute a linha final comentada de supabase.sql com seu e-mail para torná-lo admin.
10) Envie TODOS os arquivos desta pasta diretamente para public_html da Hostinger.
11) Confirme que https://radarrider.com usa HTTPS.
12) Teste em Android e iPhone: cadastro, e-mail, login, GPS, alerta, confirmação próxima, denúncia, painel admin, WhatsApp, 999/112 e instalação PWA.

IMPORTANTE
- O arquivo config.js contém somente a chave pública. Isso é esperado quando RLS está ativo.
- Nunca coloque secret key ou service_role no site.
- A exclusão definitiva do usuário em auth.users exige ação administrativa segura. O app registra uma solicitação no painel/banco.
- Para produção em escala, use um provedor de mapas com política adequada ou hospede tiles; o OpenStreetMap padrão não deve ser sobrecarregado.
