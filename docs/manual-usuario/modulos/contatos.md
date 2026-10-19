# 5. Contatos e importação

**Objetivo:** Manter os dados dos clientes.
**Quem pode utilizar:** Administrador da empresa e atendente, com autorização final do servidor.
**Como acessar:** Contatos → `/app/contatos`; editar contato também no cabeçalho da conversa.

## Campos e opções

Nome obrigatório; número obrigatório; e-mail opcional; etiquetas separadas por vírgula no formulário. Busca e paginação na listagem.

## Passo a passo

1. Busque o contato antes de criar para evitar duplicados.
2. Clique Novo, informe nome e telefone com DDI. Para brasileiros sem DDI, a normalização tenta incluir 55.
3. Informe e-mail/etiquetas se necessário e clique Salvar.
4. Para corrigir, use o lápis, revise os campos e Salvar. Na conversa, use Editar contato.
5. Para excluir, use a lixeira e confirme somente com autorização.
6. Para importar, escolha CSV/TXT, revise a prévia e inicie; acompanhe sucessos, ignorados e falhas.

## Resultado esperado

Registro criado/atualizado após resposta da API. Importação executa uma criação por linha válida; não é transação única.

## Erros e soluções

Número deve resultar em 12–15 dígitos; nome não pode ser vazio. E-mail preenchido deve ter formato válido. Em duplicidade, procure o existente. Falha em importação exige conferir totais antes de tentar novamente.

## Observações e limitações

Formato importável: `nome;numero;email;etiquetas` ou separado por vírgula; cabeçalho opcional; etiquetas do arquivo separadas por `|`. Não há importação XLSX. Parser é simples: nomes/campos com separadores ou aspas complexas podem ser interpretados incorretamente. E-mail/deduplicação da importação não têm a mesma garantia do formulário; duplicados são comparados localmente só com a lista disponível. Exclusão e efeitos sobre histórico dependem do servidor. Não foi localizado exportador de contatos.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/contacts/pages/ContactsPage.tsx`, `components/ContactFormDialog.tsx`, `import.ts`, `api.ts`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
