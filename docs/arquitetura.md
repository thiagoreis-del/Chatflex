# 2. Arquitetura técnica

## 2.1 Visão de camadas
1. TanStack Start/Router define rotas e execução inicial; `/app` não usa SSR.
2. Páginas em `src/modules/*/pages` e `src/app` compõem a interface React.
3. TanStack Query controla cache, consultas, invalidação e atualizações.
4. `src/shared/api/client.ts` centraliza HTTP, credenciais, bearer em memória, renovação e upload/download.
5. Adaptadores de módulo normalizam respostas do backend externo e, quando habilitado explicitamente, usam mocks.
6. Backend externo responde por autorização, isolamento de empresas, banco, WhatsApp e serviços de negócio. Esses serviços não estão neste repositório.

## 2.2 Estrutura real
| Diretório/arquivo | Responsabilidade |
|---|---|
| `src/routes` | Rotas de arquivo, guardas, metadados e layouts com Outlet |
| `src/router.tsx` | Criação do roteador e QueryClient |
| `src/start.ts` | Configuração Start |
| `src/server.ts` | Entrada SSR, captura de falhas e cabeçalhos de segurança |
| `src/app/layout/AppShell.tsx` | Menu, contexto, sessão, avisos e área de rolagem |
| `src/app/dashboard` | Indicadores de operação e relatório de SLA |
| `src/landing` | Página pública e planos comerciais |
| `src/modules` | Páginas, API, tipos e componentes por domínio |
| `src/shared` | API, auth, permissions, connectivity, socket, pwa, theme, i18n, config |
| `src/components/ui` | Biblioteca visual baseada em Radix/shadcn |
| `src/lib`, `src/hooks` | Utilitários e hooks compartilhados |
| `src/mocks` | Dados apenas quando `VITE_USE_MOCKS=true` |
| `src/test` | Testes Vitest e Testing Library |
| `public` | Manifesto PWA e ícones |
| `.github/workflows` | CI e atualização da VPS |
| `.lovable` e `src/index.ts` | Configuração e exportação da biblioteca de design; não é a versão da aplicação |

## 2.3 Bibliotecas declaradas (não versões instaladas certificadas)
| Biblioteca | Faixa/pin em package.json | Papel |
|---|---|---|
| React / React DOM | ^19.2.0 | Interface |
| TypeScript | ^5.8.3 | Tipos |
| Vite | 8.1.5 | Dev/build |
| TanStack Start | 1.168.60 | Framework |
| TanStack Router | 1.170.41 | Navegação |
| TanStack Query | ^5.101.1 | Cache e consultas |
| Tailwind CSS | ^4.2.1 | Tema/estilos |
| React Hook Form / Zod | ^7.90.0 / ^4.6.6 | Formulários/validação |
| i18next / react-i18next | ^26.4.3 / ^17.0.16 | Textos pt-BR |
| socket.io-client | ^4.8.4 | Tempo real |
| Recharts | ^2.15.4 | Gráficos |
| vite-plugin-pwa | ^2.0.0 | Service worker |
| Nitro | 3.0.260603-beta | Artefato de servidor |
| Vitest | ^4.1.10 | Testes |

Demais dependências: famílias `@radix-ui/react-*`, lucide-react, qrcode.react, sonner, date-fns, class-variance-authority, clsx, tailwind-merge, react-resizable-panels, cmdk e utilitários visuais. A lista exata e atualizável está em `package.json`; resolução em `bun.lock`. Overrides para rolldown, js-yaml e source-map-js constam no manifesto.

## 2.4 Componentes principais
AppShell, QueryBoundary/QueryError/LoadingState, PageHeader, formulários de empresa/contato/plano, TicketsPage e seus diálogos, AudioRecorder, ImageEditorDialog, MessageMedia, IncomingNotifications, VpsHealthSection, ClosingMessageCard e SlaSettingsCard. Estes componentes não são serviços de backend.

## 2.5 Runtime e rotas
`vite.config.ts` usa o configurador Lovable com destino Cloudflare padrão; a automação VPS seleciona `NITRO_PRESET=node-server`. Portanto o artefato de produção VPS é um servidor Node/Nitro, não uma SPA estática que se possa apontar simplesmente para `dist/index.html`. Veja [deploy](deploy.md) e [rotas](rotas.md).

**Fontes:** `package.json`, `vite.config.ts`, `src/server.ts`, `src/router.tsx`, `src/routes/app.tsx`, `AGENTS.md`.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
