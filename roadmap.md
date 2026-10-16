# Ajuste das telas
- [x] Ajustar estrutura, cabeçalho e navegação para larguras pequenas.
- [x] Ajustar Atendimento, abas, tabelas e formulários.
- [x] Verificar telas no navegador em celular e computador com demonstração isolada; conexão real preservada.

# Salvamento de filas
- [x] Enviar os campos obrigatórios do servidor na criação sem apagar configurações existentes na edição.
- [x] Melhorar os avisos de erro e testar o contrato de criação e edição.
- [ ] Validar o salvamento na VPS: depende de uma sessão autenticada no backend externo.

# Avisos de mensagens
- [x] Adicionar som, aviso na tela e permissão de notificação do navegador.
- [x] Cobrir eventos em tempo real e consulta periódica sem alertar histórico nem repetir mensagens.
- [x] Testar deduplicação, avisos por Socket e polling com quatro testes automatizados; compilação aprovada.
- [ ] Validar uma mensagem real da VPS no navegador: acesso autenticado indisponível neste teste. Som exige interação inicial; notificações dependem da permissão e suporte do navegador e não funcionam com o site fechado sem serviço push.