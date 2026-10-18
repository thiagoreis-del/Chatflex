# 4. Autenticação e sessões

## 4.1 Fluxo identificado
Login envia email/password a POST /auth/login. Aceita accessToken ou token e usuário. Token fica em memória; perfil fica em localStorage (chatbotflex.user). Rotas /app desativam SSR e chamam ensureSession no navegador. Renovação POST /auth/refresh_token pressupõe cookie do backend. Depois de renovação, ensureSession pode preferir perfil local a GET /auth/me: papel exibido pode estar desatualizado.

Cliente inclui credentials:include e Bearer quando aplicável. Uma Promise compartilha refresh simultâneo. 401 ou 403 com referência a token/session/jwt pode renovar e repetir uma vez; falha termina sessão quando aplicável. Controle de geração protege trocas concorrentes de token.

Logout limpa token, usuário, Socket e QueryClient mesmo se a chamada remota falhar. Não foi identificada limpeza geral de rascunhos/outbox no logout. Credencial legada em armazenamento é removida, não reutilizada.

## 4.2 Recuperação
POST /auth/forgot-password recebe email; POST /auth/reset-password recebe token/password. Telas existem, mas entrega do e-mail, expiração, revogação e políticas backend não foram verificadas. Não inserir token real em documentação, logs ou capturas.

## 4.3 Acesso delegado
POST /companies/:id/enter exige resposta de sessão válida. Backup administrativo é somente memória. POST /companies/exit deve retornar superadmin não delegado; em falha, tenta backup local. Recarregar perde backup; fallback não comprova saída remota/auditoria. Nenhum desses fluxos foi executado nesta auditoria.

## 4.4 Limites de segurança
Perfil local e guarda frontend não autorizam operações. Atributos HttpOnly/Secure/SameSite do cookie, CORS e autorização tenant exigem inspeção do backend. Senhas geradas usam helper criptográfico do navegador e ficam em memória do formulário; compartilhar acesso é ação explícita e sensível.

**Fontes:** src/shared/auth/{auth-service,token-store,session-store,normalize-user}.ts; src/shared/api/client.ts; src/routes/app.tsx.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
