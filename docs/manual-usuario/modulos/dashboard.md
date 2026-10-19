# 4. Dashboard e indicadores

**Objetivo:** Consultar a operação da empresa.
**Quem pode utilizar:** Usuários dos três papéis pela guarda atual; visibilidade de menu varia por contexto.
**Como acessar:** `/app/dashboard`; `/app` redireciona para essa rota no código atual.

## Campos e opções

Situação API/Socket, empresa/perfil/permissões, aguardando/abertos/encerrados hoje, TME/TMA/primeira resposta, gráfico horário, atendentes, filas e relatório SLA.

## Passo a passo

1. Confira empresa e perfil.
2. Leia os totais por status.
3. Consulte filas/atendentes e gráfico horário.
4. Observe se há valores indisponíveis/parciais.
5. Para SLA, confira relatório diário quando a API estiver disponível.

## Resultado esperado

Resumo calculado a partir dos tickets reais retornados pela API, com escopo da sessão e atualizações periódicas.

## Erros e soluções

Primeira resposta ausente → backend pode não fornecer firstResponseAt. SLA indisponível → endpoint/report não confirmado. Valores diferentes entre usuários → verificar filas, perfil, fuso e escopo antes de supor perda de dados.

## Observações e limitações

Métricas atualizam em 30 s, relatório SLA em 60 s. TMA usa firstResponseAt ou criação até updatedAt; updatedAt é aproximação, não confirmação de encerramento. Data local influencia recorte diário. Não existe exportador PDF/CSV identificado. O README antigo e memória de decisão sobre remoção do dashboard não correspondem à rota presente: esta documentação descreve o código, não cria ou reintroduz página.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/app/dashboard/*`, `src/modules/tickets/api.ts`, `src/routes/app.index.tsx`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
