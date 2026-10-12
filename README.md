# Plataforma de atendimento multicanal — Frontend

Interface web de uma plataforma SaaS multitenant de atendimento, inicialmente integrada ao WhatsApp. O nome exibido vem de `VITE_APP_NAME`.

> Estado atual: **Fase 1 — fundação** (autenticação, layout, temas, traduções, camada de API, base do Socket e permissões de apresentação).

## Arquitetura

- **Frontend (este repositório):** somente interface. Não acessa banco, Redis ou a VPS e não guarda segredos.
- **Backend (VPS existente):** Node.js, PostgreSQL, Redis, filas, WebSocket, WhatsApp e mídias. Responsável por **toda** autorização, limites, planos e cobrança.
- Comunicação somente por **HTTPS** e **WSS** com `https://api.notasflex.com.br`.

## Stack

React 19 · Vite · TypeScript estrito · Tailwind CSS v4 · shadcn/ui · TanStack Router/Start (roteamento da plataforma, no lugar do React Router) · TanStack Query · react-i18next · Zod · React Hook Form.

## Instalação e execução

```bash
bun install          # ou npm install
cp .env.example .env # ajuste se necessário
bun run dev          # desenvolvimento
bun run build        # build de produção
bun run lint         # lint
bunx tsc --noEmit    # verificação de tipos
```

## Variáveis (todas públicas)

| Variável | Uso |
| --- | --- |
| `VITE_API_URL` | URL base da API |
| `VITE_SOCKET_URL` | URL do Socket |
| `VITE_APP_NAME` | Nome exibido |
| `VITE_APP_URL` | URL pública do app |
| `VITE_USE_MOCKS` | `true` ativa mocks de demonstração |

Toda variável `VITE_` vai para o navegador. **Nunca** use para segredos.

## Estrutura de pastas

```text
src/
  app/          layout autenticado, dashboard e páginas de status
  landing/      página institucional
  modules/      módulos de negócio (auth implementado; demais reservados)
  shared/       api, auth, socket, permissions, errors, theme, i18n, config, components, hooks
  mocks/        dados fictícios (somente com VITE_USE_MOCKS=true)
  routes/       arquivos de rota (/, /login, /esqueci-minha-senha, /redefinir-senha, /app, /app/dashboard, /403, /404, /indisponivel)
```

## Autenticação

1. `/login` envia e-mail e senha para `POST /auth/login`.
2. O backend devolve `accessToken` + usuário; o token fica **somente em memória** (`src/shared/auth/token-store.ts`).
3. O refresh token é um cookie `HttpOnly; Secure; SameSite` criado pelo backend. Todas as chamadas usam `credentials: "include"`.
4. Ao recarregar, `/app` chama `POST /auth/refresh_token` e `GET /auth/me`. Falha → `/login`; servidor fora → `/indisponivel`.
5. Em `401`, o cliente faz **uma** renovação compartilhada entre chamadas simultâneas e repete a requisição; se falhar, encerra a sessão.
6. Logout chama `POST /auth/logout`, limpa token, sessão, cache e Socket.

Tokens **nunca** vão para localStorage, sessionStorage, IndexedDB ou cookies legíveis por JS.

## Erros

`src/shared/api/errors.ts` tipa 401, 403, 404, 409, 422, 429, 5xx, rede e cancelamento. Avisos centralizados em `src/shared/errors/handle-error.ts` (ligados ao TanStack Query). Textos em `src/shared/i18n/locales/pt-BR/errors.json`.

## Permissões

`hasRole`, `hasPermission`, `hasAnyPermission`, `PermissionGate` e `requireRole` (rotas). **Apenas melhoram a interface** — o backend valida cada ação.

## Socket

`src/shared/socket/socket-client.ts`: inicia após login, encerra no logout, reconexão exponencial, status observável, sem entrar em salas. **Desativado** (`SOCKET_ENABLED = false`) até o contrato ser confirmado.

## Mocks

Somente em `src/mocks`, carregados dinamicamente apenas com `VITE_USE_MOCKS=true`. Sem fallback automático. Uma faixa "Ambiente de demonstração" aparece quando ativos. Senha de demonstração: `demo1234`.

## Integração pendente com a API

Contratos **não confirmados** (ver `src/shared/config/endpoints.ts`):

- `POST /auth/login` → `{ accessToken, user }`
- `POST /auth/refresh_token` → `{ accessToken }`
- `POST /auth/logout`
- `POST /auth/forgot-password` `{ email }`
- `POST /auth/reset-password` `{ token, password }`
- `GET /auth/me` → `AuthenticatedUser`
- Socket: protocolo, caminho e autenticação
- CORS do backend precisa permitir a origem do app com credenciais.

## Regras de segurança

- Nenhum segredo (senhas, SSH, JWT secret, banco, Redis, sessões do WhatsApp, SMTP, chaves de pagamento) no código.
- `companyId`, perfil e permissões vindos do navegador não provam autorização.
- Sem senha universal ou bypass de autenticação.
- Nunca versionar `.env`, chaves, certificados, dumps, backups, sessões ou mídias.

## Processo sugerido no GitHub

- Repositório **privado**; `main` protegida.
- Branches `feat/…`, `fix/…`; Pull Request obrigatório com revisão.
- CI executando lint, verificação de tipos e build em cada PR.
