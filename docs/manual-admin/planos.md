# 3. Planos

**Objetivo:** Manter catálogo e limites contratuais.
**Quem pode utilizar:** Superadmin.
**Como acessar:** Plataforma → Planos; Novo plano ou detalhe.

## Campos e opções
Nome até 80, descrição até 500, mensalidade, anualidade opcional, limites, teste 0–365, público/ativo e flags de recursos. Ações: criar, editar, duplicar, público/ativo, excluir, comparar e sugeridos.

## Passo a passo
1. Novo plano → nome, mensalidade válida e limites inteiros não negativos (usuários mínimo 1).
2. Escolha recursos; eles são flags, não implantação automática de funcionalidades.
3. Salve e confira o detalhe.
4. Para sugeridos, execute criação e confira cada resultado, pois é sequencial.
5. Antes de trocar plano de empresa, confira consumo e risco de downgrade com o backend; helper local não é aplicado no diálogo.
6. Excluir/alterar público exige autorização e avaliação de empresas vinculadas.

## Resultado esperado
Plano normalizado da API; preços são centavos no frontend e amount decimal no envio.

## Erros e soluções
Valor inválido → revisar; erro ao criar sugeridos → conferir já criados para evitar duplicados. Limites e cobrança final precisam de validação servidor.

## Observações e limitações
Sugestões reais: 1 conexão R$99,90, 2 R$150,00, 3 R$200,00; usuários/filas “ilimitados” são 9999, teste sugerido 15 dias. Descrição/anualidade/armazenamento não são enviados no modo real. active mapeia isPublic, não comprova desativação operacional. Relatórios avançados mapeia useKanban, automações useSchedules; flags não comprovam módulos existentes. Página pública tem fallback de catálogo padrão se não há planos elegíveis.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/plans/api.ts`, `commercial.ts`, `components/PlanForm.tsx`, `pages/PlanPages.tsx`, `src/landing/PublicPlans.tsx`.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
