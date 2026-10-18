# 7. Chat interno

**Objetivo:** Conversar com colegas dentro da empresa, separado do WhatsApp do cliente.
**Quem pode utilizar:** Administrador e atendente; superadmin pela guarda.
**Como acessar:** Chat interno → `/app/chat-interno`.

## Campos e opções
Conversas diretas, grupos ou fila; participantes, nome e fila conforme tipo; mensagens, anexos, áudio, menções e referência a ticket conforme controles disponíveis.

## Passo a passo
1. Abra a lista e selecione uma conversa existente ou Nova conversa.
2. Escolha o tipo, participantes e nome/fila quando solicitados.
3. Crie a conversa e envie texto pelo compositor.
4. Para anexos/áudio, confira arquivo/permissão antes de enviar.
5. Quando disponível, use menção de colega ou referência ao atendimento.
6. Gerencie membros pelas ações oferecidas, apenas com autorização.

## Resultado esperado
Mensagens enviadas ao contrato `/internal-chat`, não ao endpoint de WhatsApp do cliente. Isolamento real da empresa deve ser validado no backend.

## Erros e soluções
Lista vazia/404 → confirmar instalação das rotas; falha de mídia → conferir API e arquivo; sem usuário/fila elegível → revisar cadastros. Não tratar o chat interno como disponível offline sem prova.

## Observações e limitações
Consulta de mensagens usa pageNumber=1; não documentar histórico ilimitado. Tipos: kind, userIds, name opcional, queueId opcional. Contrato está marcado como pendente no código; confirmação anterior do usuário não é execução nesta auditoria. Não foi identificado Web Push próprio.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/internal-chat/pages/InternalChatPage.tsx`, `api.ts`, `types.ts`, `src/routes/app.chat-interno.tsx`.

---
[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
