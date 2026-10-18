# 3. Rotas do frontend

As rotas estão em arquivos planos em src/routes, não em src/routes/app/. __root fornece a estrutura; app e app.plataforma são layouts com Outlet. Árvore gerada não deve ser editada manualmente.

| URL | Tela | Guarda frontend |
|---|---|---|
| / | Página pública e planos | Pública |
| /login | Entrar | Pública |
| /esqueci-minha-senha | Recuperar senha | Pública |
| /redefinir-senha | Redefinir por token | Pública |
| /403, /404, /indisponivel | Erros/acesso/indisponibilidade | Pública |
| /app | Layout e restauração de sessão | Autenticada, ssr:false |
| /app/ | Redirecionamento para dashboard | Autenticada |
| /app/dashboard | Indicadores da empresa | Três papéis |
| /app/atendimento | Lista e conversa | company_admin/agent; bypass superadmin |
| /app/contatos | Contatos | company_admin/agent; bypass superadmin |
| /app/respostas-rapidas | Atalhos e agradecimento quando montado | company_admin/agent; bypass superadmin |
| /app/chat-interno | Conversas de equipe | company_admin/agent; bypass superadmin |
| /app/conexoes | Números WhatsApp | module.connections |
| /app/status | Publicar fotos no Status | module.status |
| /app/usuarios | Equipe | company_admin; bypass superadmin |
| /app/filas | Filas | company_admin; bypass superadmin |
| /app/configuracoes | Horários e SLA | company_admin; bypass superadmin |
| /app/plataforma/ | Plataforma e VPS | superadmin herdado |
| /app/plataforma/empresas/ | Empresas | superadmin herdado |
| /app/plataforma/empresas/nova | Cadastro | superadmin herdado |
| /app/plataforma/empresas/:companyId/ | Detalhe e abas | superadmin herdado |
| /app/plataforma/empresas/:companyId/editar | Editar | superadmin herdado |
| /app/plataforma/planos/ | Planos | superadmin herdado |
| /app/plataforma/planos/novo | Cadastro plano | superadmin herdado |
| /app/plataforma/planos/:planId | Detalhe plano | superadmin herdado |
| /app/plataforma/assinaturas | Consulta | superadmin herdado |
| /app/plataforma/faturas | Consulta | superadmin herdado |
| /app/plataforma/auditoria | Consulta de eventos | superadmin herdado |
| /app/plataforma/backups | Solicitações e agenda | superadmin herdado |

:companyId e :planId correspondem aos parâmetros $companyId/$planId dos arquivos. Guardas não comprovam autorização remota. Menu Relatórios está desabilitado; não existe rota de Central de Ajuda implementada por esta tarefa.

**Fonte:** arquivos src/routes/*.tsx e AppShell.tsx.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
