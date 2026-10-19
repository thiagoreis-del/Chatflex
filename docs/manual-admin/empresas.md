# 2. Empresas e acesso delegado

**Objetivo:** Cadastrar e gerenciar empresas clientes.
**Quem pode utilizar:** Superadmin.
**Como acessar:** Plataforma → Empresas; lista, Nova empresa, detalhe e Editar.

## Campos e opções

Cadastro: razão social, fantasia, CPF/CNPJ, e-mail, telefone, responsável, plano, teste 0–365 dias, limites, status, observações (até 2.000), primeiro admin (nome/e-mail/telefone/senha/confirmar).
Filtros: busca, status, plano e página. Detalhe: visão geral, usuários, conexões, limites, assinatura, recursos, faturas e auditoria.

## Passo a passo

1. Busque a empresa e confira filtros.
2. Nova empresa: preencha obrigatórios; consulta CNPJ (14 dígitos) pode preencher dados, que devem ser revisados.
3. Selecione plano ativo; limites/teste são preenchidos do plano. Confira senha gerada (8–128) e confirmação.
4. Salve uma vez e confira o detalhe. Senha inicial é enviada no campo password; confirmação não é enviada.
5. Editar: confira dados e salve. Limitações de persistência abaixo são importantes.
6. No detalhe, use abas para consultar usuários/conexões e dados disponíveis.
7. Ação sensível exige motivo de 10–500 caracteres; suspender/cancelar pede nome fantasia exato. Trocar plano/vencimento exige respectivo valor.
8. Excluir pede EXCLUIR, ignorando caixa; não executar sem autorização.
9. Entrar na empresa solicita sessão delegada ao backend; confira banner de contexto.
10. Sair da empresa tenta restaurar superadmin não delegado; backup da sessão original é apenas em memória, perdido ao recarregar.

## Resultado esperado

Empresa recebida da API; alterações são normalizadas no frontend. Entrada não cria privilégio local: depende de token/usuário válidos retornados.

## Erros e soluções

Plano indisponível → revisar cadastro; CPF/CNPJ/e-mail/telefone inválidos → corrigir. Ampliar limites falha no modo real porque limites vêm do plano. Reativar com vencimento passado pode continuar inadimplente; revisar vencimento sem confundir status.

## Observações e limitações

**Campos sem persistência separada no adaptador real:** razão/fantasia viram um name; responsável, notas, limites individuais e telefone do primeiro admin não são enviados; status de criação é true; e-mail enviado prioriza primeiro admin. Editar pode exigir preencher responsável novamente, embora não o salve.
Cancelamento/suspensão enviam status=false; não há cancelamento financeiro distinto. Motivo digitado é descartado no payload real. Encerrar teste define vencimento ontem. Consumo real indisponível usa -1. Filtros status/plano são pós-paginação, mantendo count global. Lista de conexões de outras empresas é recebida globalmente e filtrada no cliente: servidor deve autorizar adequadamente. Novo usuário no detalhe inclui companyId, mas lista de filas não explicita companyId. Fallback de saída em memória não comprova encerramento/auditoria remoto.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/companies/{api,schemas,types}.ts`, `components/CompanyForm.tsx`, `components/SensitiveActionDialog.tsx`, `pages/CompanyDetailPage.tsx`, `src/shared/auth/auth-service.ts`.

---

[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
