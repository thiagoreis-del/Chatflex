# 5. Permissões

| Área | agent | company_admin | superadmin |
|---|---|---|---|
| Dashboard, Atendimento, Contatos, Respostas rápidas, Chat interno | Sim pela guarda | Sim | Sim |
| Status | Padrão sim via catálogo | Sim | Sim |
| Conexões | Padrão não via catálogo | Sim | Sim |
| Usuários, Filas, Configurações | Não pela guarda | Sim | Sim |
| Plataforma/Empresas/Planos/Faturas/Assinaturas/Auditoria/Backups | Não | Não | Sim |
| Transferência | Padrão sim; elegibilidade depende da fila | Sim | Sim |
| Encerrar em lote/recusar/assinatura de colega | Não nos controles administrativos | Sim | Sim |

hasRole concede bypass ao superadmin. can concede todos ao superadmin; para os demais, permissões recebidas contendo ponto substituem os defaults. hasPermission faz comparação literal, sem todos os defaults de can. Não confundir esses mecanismos.

Catálogo: module.dashboard, module.tickets, module.connections, module.status, module.contacts, module.quickMessages, module.users, module.queues, module.settings, tickets.transfer e tickets.closeAll. Chat interno tem guarda por papel, não chave própria nesse catálogo. A maioria das rotas usa papel; somente trocar catálogo não controla todas as rotas.

Normalização aceita role interna reconhecida, depois super=true, depois profile=admin, senão agent. Perfil cadastral supervisor não cria papel interno próprio. Não foi encontrado editor universal de permissões por ação.

**Tudo acima é controle de interface.** Servidor deve validar autenticação, papel, empresa e recursos em cada chamada. Banco/RLS não inspecionados. GET globais e filtros frontend não comprovam isolamento.

**Fontes:** src/shared/permissions/{permissions,catalog,route-guards}.ts; src/shared/auth/normalize-user.ts; src/routes/*.tsx.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
