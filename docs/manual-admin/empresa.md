# 1. Administração da empresa

**Objetivo:** Gerenciar equipe, filas e configuração operacional.
**Quem pode utilizar:** company_admin e superadmin; não agent pelas guardas de rota.
**Como acessar:** Usuários `/app/usuarios`, Filas `/app/filas`, Conexões e Configurações.

## Campos e opções
**Usuários:** nome, e-mail, perfil cadastral admin/supervisor/user, filas, bloqueio e senha.
**Filas:** nome, cor, saudação.
**Conexões/configurações:** veja manuais específicos.

## Passo a passo
1. Em Usuários, busque antes de criar; clique Novo.
2. Preencha nome/e-mail, escolha perfil e filas. Use a senha gerada ou outra com mínimo de oito caracteres; Salvar.
3. Dados de acesso podem ser copiados ou compartilhados por WhatsApp; não divulgue capturas/links com senha.
4. Editar usuário: senha vazia mantém a anterior; preenchida deve ter pelo menos oito caracteres.
5. Redefinir gera nova senha e exibe acesso. Não há troca obrigatória/expiração demonstrada só pelo rótulo “temporária”.
6. Bloquear exige confirmação; desbloquear é direto; excluir exige confirmação e autorização.
7. Em Filas, Nova fila → nome com dois ou mais caracteres, cor e saudação → Salvar.
8. Edite ou exclua pela tabela. Alteração lê fila completa antes de salvar para preservar campos ocultos.
9. Configure Conexões/horários/SLA conforme manuais de usuário.
10. No atendimento, admin pode Recusar, escolher assinatura de colega e encerrar em lote.

## Resultado esperado
Usuários e filas atualizados após resposta da API, sem garantia de revogação de sessões por bloqueio até validação do contrato.

## Erros e soluções
Nome/e-mail inválidos → corrigir; fila com nome/cor duplicada ou limite de plano → conferir mensagem e contrato. Leitura prévia de fila falhou → edição não é enviada. Senha não pode aparecer em logs/capturas.

## Observações e limitações
Perfil supervisor é cadastral: não há papel de rota separado; normalização usual o converte em agent. Nenhuma fila é obrigatória no submit de usuário. Compartilhar abre wa.me, não envio automático pelo backend. Campos avançados de fila não são editáveis nessa tela; mensagens/escala/integrações são preservadas.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/users/pages/UsersPage.tsx`, `api.ts`, `access.ts`, `src/modules/queues/pages/QueuesPage.tsx`, `contract.ts`, `src/shared/auth/normalize-user.ts`.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
