# 6. Respostas rápidas

**Objetivo:** Reutilizar textos de atendimento.
**Quem pode utilizar:** Administrador e atendente, sujeitos ao backend.
**Como acessar:** Respostas rápidas → `/app/respostas-rapidas`.

## Campos e opções
Atalho, mensagem e opção de disponibilidade geral. Busca, novo, editar e excluir.

## Passo a passo
1. Clique Nova resposta.
2. Escolha atalho de 2–30 caracteres com letras minúsculas, números, hífen ou sublinhado.
3. Preencha mensagem e disponibilidade; clique Salvar.
4. Na conversa, selecione no menu de respostas ou digite `/atalho`.
5. Para corrigir, use editar; excluir exige confirmação.

## Resultado esperado
Texto reutilizável disponível no seletor após consulta; selecioná-lo não envia automaticamente sem a ação de envio.

## Erros e soluções
Atalho inválido: remover caracteres especiais ou ajustar tamanho; mensagem vazia: preencher. Falha no salvamento: conferir API/permissão e não criar várias cópias.

## Observações e limitações
Barras iniciais são removidas, espaços viram hífen e letras ficam minúsculas. Lista percorre até 50 páginas. Disponibilidade pessoal/geral e isolamento precisam ser garantidos no backend. Agradecimento de encerramento aparece em cartão de configuração compartilhado quando montado; sua persistência usa outra API, não o cadastro de atalho.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/quick-messages/pages/QuickMessagesPage.tsx`, `components/QuickMessagePicker.tsx`, `api.ts`, `src/modules/settings/ClosingMessageCard.tsx`.

---
[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
