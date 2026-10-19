# 5. Assinaturas, faturas e auditoria

**Objetivo:** Consultar contratos financeiros e registros administrativos.
**Quem pode utilizar:** Superadmin.
**Como acessar:** Plataforma → Assinaturas, Faturas ou Auditoria.

## Campos e opções

Assinaturas: empresa/status/página; Faturas: empresa/status, intervalos de criação/vencimento; Auditoria: datas/empresa/usuário/ação/resultado, recurso e ID via URL.

## Passo a passo

1. Selecione filtros e confira página/resultado.
2. Em Assinaturas, consulte ciclo, status, período e próxima cobrança; abra Histórico quando disponível.
3. Em Faturas, confira valor, status, vencimento, pagamento e criação.
4. Em Auditoria, consulte ator, ação, recurso, resultado, motivo e origem.
5. Veja acessos delegados para entrada/saída de empresa quando o endpoint responder.

## Resultado esperado

Consulta das APIs /platform; não criação de cobrança nem trilha comprovada de todas as alterações.

## Erros e soluções

404/indisponível → contrato pode não estar implantado; solicite validação. Filtrar Auditoria pela URL pode manter resource/resourceId após Limpar; revise filtros. Valores em centavos/BRL esperados; conferir contrato.

## Observações e limitações

Só leitura: não há pagar, boleto/Pix, baixa, estorno, exportação ou edição financeira. Assinaturas/faturas usam contratos pendentes /platform. Motivo exigido em ações de empresa não é enviado no modo real; não garantir auditoria completa. Histórico de assinatura consulta até50 eventos na primeira página. Acessos delegados não demonstram paginação backend.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/billing/*`, `src/modules/audit/*`, `src/shared/config/endpoints.ts`.

---

[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
