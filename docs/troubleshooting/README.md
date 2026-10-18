# 13. Problemas, soluções e perguntas frequentes

| Sintoma | Conferir | Ação segura |
|---|---|---|
| Login falha | Email, senha, API e mensagem de erro | Não reenviar credenciais em chat; recuperar senha com autorização |
| Sessão some ao recarregar | Renovação por cookie e conectividade | Solicitar diagnóstico do cookie/CORS; não guardar token no navegador |
| Sem acesso à página | Empresa, perfil, autorização | Pedir revisão ao administrador; não editar perfil local para contornar |
| Mensagens não chegam | API, Socket, polling e conexão WhatsApp | Conferir ticket/número correto; não desconectar sessão para testar |
| Navegador não toca/notifica | Gesto do usuário, som e permissão | Ativar/testar pelos controles; não é aviso garantido com app fechado |
| Texto aguardando rede | Outbox local e ticket aberto | Conferir pendência antes de duplicar envio manual |
| Anexo falha | Limite10/16MiB, arquivo permitido, rede | Reenviar somente restantes depois de confirmar enviados |
| Nome da mídia incorreto | URL/nome de arquivo retornado | Registrar exemplo sem dados reais para manutenção |
| Transferência desabilitada | Fila e usuários vinculados | Admin revisa vínculo; diálogo não troca fila |
| Contato importado errado | Separador/aspas/telefone/header | Corrigir arquivo pequeno de teste, revisar prévia e não duplicar importação |
| Usuário bloqueado ainda loga | Contrato blocked e revogação | Validar servidor; checkbox não prova bloqueio efetivo |
| Fila não salva | GET prévio, limites/nome/cor | Conferir erro; não repetir com perda de campos ocultos |
| Status não aparece | Endpoint experimental e destinatário elegível | Homologar visibilidade; upload aceito não é confirmação de publicação |
| Fora do expediente não envia | Horário, fuso, configurações de empresa/conexões | Revisar resultado das várias escritas e regra backend |
| Dashboard/VPS mostra0 | Métrica real, falha convertida em null/lista vazia | Não considerar consumo real nulo nem receita conciliada |
| Não configurado no serviço | Status exato informado | Não confundir com offline; confirmar qual serviço backend utiliza |
| Ampliar limite falha | Limites derivados do plano | Recurso real não implementado; não assumir limite individual |
| Auditoria/faturas404 | Contrato /platform pendente | Solicitar confirmação do backend, não inventar eventos/cobranças |
| Backup parece concluído | Status original/backend | Status desconhecido vira completed; validar integridade em ambiente isolado |

## Perguntas frequentes
**Recusar devolve à fila?** Não; encerra e oculta localmente para quem recusou. Transferir para Qualquer atendente é o fluxo de retorno a pending.

**Assinatura de colega troca o login?** Não; é seleção no compositor. Backend deve garantir autoria/auditoria. Acesso delegado é outro fluxo.

**Todos os dados funcionam offline?** Não; rascunho/outbox de texto são locais. Anexos, histórico completo e ações administrativas dependem da API.

**O histórico VPS fica salvo?** Não no frontend; são até120 amostras em memória React.

**Plano com IA/campanhas significa recurso pronto?** Não; flags de plano não comprovam implementação ou integração.

**Posso restaurar backup para ver se botão funciona?** Não. Exige autorização, recuperação isolada e validação de integridade.

## Encaminhar um problema
Registrar data/fuso, módulo, ação, mensagem sanitizada, perfil e estado de conectividade. Remover telefone, email, conteúdo de cliente, senha, token, cookies e headers de autenticação. Não anexar dumps de produção ou logs integrais sem revisão. Diagnóstico VPS, quando autorizado, deve ser feito um comando seguro por vez, aguardando resultado; este manual não autoriza comandos.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
