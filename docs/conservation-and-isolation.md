# Conservação de conversas e contatos

## Implementação da interface

- Finalizar e recusar enviam `PUT /tickets/:id` com `status: closed`. Não enviam exclusão de contato, mensagens, fila ou responsável.
- Finalizados não usam a antiga lista de recusados no navegador. Todos os registros devolvidos pelo servidor continuam acessíveis, sujeitos aos filtros escolhidos e à autorização do servidor.
- O histórico combina páginas por ID do atendimento, não por contato, preservando vários atendimentos do mesmo contato. A busca e o escopo de filas acompanham cada página antiga.
- Contatos, listas de atendimentos, páginas antigas e mensagens têm cache separado por empresa e usuário da sessão. Os caches são descartados ao perder/trocar sessão ou mudar permissões, papel ou filas.
- Logout remove sessão e caches do aplicativo, não registros do servidor. Novo login consulta novamente as APIs. Não persistir histórico completo nem tokens em armazenamento do navegador como alternativa ao servidor.

Fontes: `src/modules/tickets/api.ts`, `history.ts`, `pages/TicketsPage.tsx`, `components/TransferTicketDialog.tsx`, `src/modules/contacts/api.ts`, `src/shared/auth/auth-service.ts`, `session-cache.ts`, `src/shared/api/query-keys.ts`, `src/router.tsx`.

## Requisitos pendentes no servidor externo

Este repositório não contém o backend da VPS; os itens abaixo são requisitos a verificar, não correções aplicadas nele:

1. Empresa deve ser extraída da sessão validada, nunca confiada a partir do corpo ou parâmetros do cliente. Consultas, detalhes, mensagens, anexos e alterações devem validar empresa e permissão do usuário antes de retornar ou alterar dados.
2. Finalizar/recusar deve mudar o estado do atendimento sem apagar contato, mensagens ou mídia, nem apagar a atribuição existente por ausência de campo no payload. Logout deve apenas revogar a sessão.
3. Respeitar filas/permissões dos atendentes e acesso administrativo somente à própria empresa. Tickets sem fila precisam de regra explícita do servidor; não usar `showAll` para contornar uma negativa de acesso.
4. Auditar tarefas de limpeza, cascatas, expiração e políticas de exclusão: não apagar automaticamente registros apenas por encerramento, recusa ou saída. Pedidos autorizados de exclusão devem seguir política explícita e auditada.
5. Backup deve cobrir banco e mídia, incluir cópia protegida fora da VPS e ter restauração testada em ambiente isolado; não substituir produção para testar.

## Validação necessária com contas reais

- Na empresa A, criar um contato e atendimento com texto e anexo; finalizar, buscar nos Finalizados, sair e entrar novamente, confirmando os mesmos IDs, mensagens e arquivo.
- Repetir com recusa e verificar administradores e atendentes autorizados.
- Com conta da empresa B, tentar listagem e acesso direto aos IDs de A (contato, ticket, mensagem e mídia). Nenhum dado de A pode ser retornado.
- Verificar um atendente sem permissão para a fila e confirmar negativa mesmo com parâmetros alterados.

Testes locais cobrem a interface e limpeza de caches; não comprovam persistência ou isolamento no servidor real.