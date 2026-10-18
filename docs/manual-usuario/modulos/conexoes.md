# 9. Conexões WhatsApp

**Objetivo:** Gerenciar os números e seus estados.
**Quem pode utilizar:** Administradores por padrão; outros só quando `module.connections` e backend autorizarem.
**Como acessar:** Conexões → `/app/conexoes`.

## Campos e opções
Nome, saudação opcional e padrão; estados conectado, desconectado, QR, abrindo, pareando, pendente e timeout.

## Passo a passo
1. Com autorização, clique Nova conexão e informe nome.
2. Configure saudação e se será padrão; salve.
3. A criação pode iniciar o fluxo de sessão. Abra o QR e faça a vinculação pelo aparelho responsável.
4. Aguarde o estado CONNECTED antes de usar a conexão.
5. Editar altera os campos apresentados; renovar QR/iniciar sessão são ações distintas de editar.
6. Desconectar ou excluir pede confirmação: execute só após entender impacto nos atendimentos.

## Resultado esperado
Conexão listada e estado consultado periodicamente. QR aceito deve resultar em CONNECTED informado pela API.

## Erros e soluções
QR vencido → renovar com autorização; timeout → conferir API e aparelho. Conexão acima do limite → verificar plano no servidor. Não excluir/recriar só para testar disponibilidade.

## Observações e limitações
Lista consulta a cada 15 s; QR a cada 2,5 s. Nome deve ser não vazio. Unicidade e conexão padrão dependem do servidor. Nenhuma sessão foi iniciada, desconectada ou alterada nesta auditoria.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/whatsapp/pages/ConnectionsPage.tsx`, `api.ts`, `types.ts`.

---
[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
