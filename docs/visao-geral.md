# 1. Visão geral

## 1.1 Identidade e objetivo

ChatbotFlex é uma interface SaaS multitenant de atendimento pelo WhatsApp. Organiza contatos, conversas, filas, atendentes e gestão comercial de empresas. O nome exibido vem de `VITE_APP_NAME`; não é derivado do nome do pacote npm (`tanstack_start_ts`).

## 1.2 Públicos

- **Atendente (`agent`):** atendimento, contatos, respostas rápidas, chat interno e Status conforme regras da interface.
- **Administrador da empresa (`company_admin`):** operação e gestão de usuários, filas, conexões e configurações.
- **Superadministrador (`superadmin`):** empresas, planos, visão da plataforma, faturas, assinaturas, auditoria e backups, além de acesso operacional/contexto de empresa.

## 1.3 Inventário funcional

| Área                        | Módulos encontrados                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Acesso público              | Página inicial, login, recuperar/redefinir senha, páginas de erro                      |
| Operação                    | Dashboard, Atendimentos, Contatos, Respostas rápidas, Chat interno, Publicar Status    |
| Administração da empresa    | Usuários, Filas, Conexões, Configurações, SLA e agradecimento                          |
| Administração da plataforma | Visão geral, Saúde da VPS, Empresas, Planos, Assinaturas, Faturas, Auditoria, Backups  |
| Transversal                 | Tema, pt-BR, notificações, PWA, conectividade, rascunhos, reenvio de texto             |
| Reservas sem módulo próprio | Campanhas, Automações, Fluxos, Arquivos, Relatórios, Papéis, Mensagens e Monitoramento |

Mensagens, mídia e monitoramento existem dentro de outros módulos; uma pasta reservada não significa ausência desses recursos transversais. Veja o [mapa detalhado](mapa-funcionalidades.md).

## 1.4 Limite da evidência

As três páginas públicas foram renderizadas no navegador local, sem erros de página observados. As telas internas foram documentadas pela leitura do código, não por uma sessão real. Não houve envio de WhatsApp, restauração, edição de empresa ou acesso à VPS durante a auditoria. Não certificar recursos de produção apenas por existir um botão ou um tipo TypeScript.

**Fontes:** `src/routes/`, `src/modules/`, `src/app/layout/AppShell.tsx`, `src/shared/auth/types.ts`, `src/shared/config/env.ts`.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
