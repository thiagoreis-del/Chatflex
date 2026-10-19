# 6. Backups na plataforma

**Objetivo:** Solicitar criação e consultar backups expostos pela API.
**Quem pode utilizar:** Superadmin, com autorização específica para restaurar.
**Como acessar:** Plataforma → Backups.

## Campos e opções

Criar; lista arquivo/tamanho/status/data; baixar/restaurar; agenda habilitada, diária/semanal/mensal, hora e retenção.

## Passo a passo

1. Consulte lista e confira se está realmente concluído no servidor.
2. Criar solicita POST e acompanha pending/running a cada5s.
3. Baixar inicia download autenticado.
4. Agenda: escolha frequência/hora/retenção e Salvar; confirme a programação no backend.
5. Restaurar: **não executar como teste de interface**. Obtenha autorização, janela, backup atual e teste isolado conforme guia técnico.
6. Confirmação textual e toast não substituem acompanhamento/validação de restauração.

## Resultado esperado

Solicitações HTTP; integridade, cobertura e execução dependem de backend não inspecionado.

## Erros e soluções

Formato inesperado pode aparecer como completed; estado desconhecido precisa de conferência. Falha/sem lista → confirmar rotas antes de presumir ausência de arquivos na VPS.

## Observações e limitações

Agenda padrão local desabilitada/diária03:00/retenção7 não comprova cron. Retenção anuncia1–365 no input, handler só força mínimo1; unidade/fuso não comprovados. Não há upload de dump local, checksum, cópia externa ou acompanhamento do restore. Tela não demonstra ligação com script manual da VPS. Veja [procedimento seguro](../backup.md).

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/backup/api.ts`, `pages/BackupsPage.tsx`, `src/shared/config/endpoints.ts`.

---

[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
