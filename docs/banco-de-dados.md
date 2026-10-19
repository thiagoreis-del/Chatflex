# 4. Banco de dados e relacionamentos

## 4.1 O que foi e não foi identificado

Este repositório é o frontend. Não contém migrações do banco de negócio, modelos ORM do backend, conexão SQL, dump de schema ou políticas RLS. O histórico operacional informa PostgreSQL 14 na VPS, mas esta auditoria não acessou o servidor nem verificou o catálogo do banco.

**Não é possível documentar honestamente:** nomes físicos de todas as tabelas, chaves, índices, constraints, cardinalidade física, retenção, triggers, funções SQL, grants ou políticas RLS. Ausência de RLS no frontend não prova ausência de autorização no backend.

## 4.2 Entidades lógicas consumidas

| Entidade lógica                 | Relações inferidas dos tipos/contratos                | Fonte                                                 |
| ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Empresa                         | plano, usuários, conexões e contexto da sessão        | `companies/types.ts`, `companies/api.ts`              |
| Plano                           | limites e flags; empresas referenciam planId          | `plans/types.ts`, `plans/api.ts`                      |
| Usuário                         | perfil, empresa e filas                               | `users/types.ts`, `shared/auth/types.ts`              |
| Fila                            | tickets e usuários; campos de roteamento              | `queues/types.ts`, `queues/contract.ts`               |
| Contato                         | telefone, e-mail, etiquetas e tickets                 | `contacts/types.ts`, `tickets/types.ts`               |
| Atendimento                     | contato, usuário, fila, conexão e mensagens           | `tickets/types.ts`                                    |
| Mensagem                        | atendimento; texto, mídia, nota e citação             | `tickets/types.ts`, `tickets/api.ts`                  |
| Conversa interna                | membros, mensagens, possível referência a atendimento | `internal-chat/types.ts`                              |
| Configuração                    | chave/valor no contexto da empresa                    | `settings/closing-message.ts`, `sla/sla.ts`           |
| Fatura/assinatura/evento/backup | modelos recebidos pelas APIs correspondentes          | `billing/types.ts`, `audit/types.ts`, `backup/api.ts` |

Veja [diagrama lógico](fluxogramas/banco-logico.md). Ele representa o contrato de interface, **não um ERD físico confirmado**.

## 4.3 Evidências necessárias para completar

Exportação somente do schema sem dados e sem credenciais, migrações/modelos do backend, versão PostgreSQL real, política de isolamento por empresa e permissões de acesso. Revisão desses itens requer autorização e acesso externo; não executar consultas ou alterar produção para completar lacunas.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
