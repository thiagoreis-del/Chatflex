# 4. Atendimentos e mensagens

**Objetivo:** Organizar e responder às conversas de clientes.
**Quem pode utilizar:** Atendente e administrador; Recusar e seleção de assinatura de colega são administrativos. Superadmin passa pelas guardas.
**Como acessar:** Menu Atendimentos → `/app/atendimento`.

## Campos e opções

- Abas: Atendendo/abertos, Aguardando, Grupos e Finalizados.
- Busca, conexão, atendente, não lidas e SLA quando habilitado; limpar filtros/atualizar.
- Contato, telefone, conexão, fila, responsável e etiquetas no cabeçalho.
- Composição: texto, nota privada, emoji, respostas rápidas, citação, arquivos/áudio.
- Administrador: escolher usuário de resposta da empresa; encerrar em lote e Recusar.

## Passo a passo

1. Abra a aba e localize a conversa com busca/filtros.
2. Selecione o atendimento. Em Aguardando, use Aceitar; em aberto sem responsável, assuma quando oferecido.
3. Para responder, mantenha o atendimento aberto. Digite texto e use Enviar/Enter; Shift+Enter insere quebra de linha.
4. Administrador pode escolher outro usuário na assinatura. A mensagem pública recebe o nome escolhido; isso não é login como o colega nem prova autoria auditada no servidor. Alterar assinatura não deve limpar a conversa/rascunho.
5. Para resposta rápida, abra o seletor ou digite `/atalho`; selecione antes de enviar.
6. Para nota interna, ative nota privada; não a use como resposta ao cliente.
7. Para citar, escolha Responder na mensagem e confira a prévia; a navegação à mensagem citada depende de ela estar carregada.
8. Para anexar, selecione até 10 arquivos, cada um até 16 MiB e maior que zero. Confira prévias e legenda; pode editar imagens compatíveis. A legenda se aplica ao primeiro arquivo no envio sequencial.
9. Para gravar áudio, permita microfone, grave e confira antes do envio. Formato depende do navegador.
10. Para transferir, abra Encaminhar, escolha usuário vinculado à fila atual ou Qualquer atendente, e observação opcional. Não há escolha de outra fila nesse diálogo.
11. Para finalizar, clique Finalizar. Agradecimento ativo/preenchido pode ser enviado automaticamente, sem nova pergunta; caso contrário há diálogo.
12. Para recusar atendimento suspeito, administrador usa Recusar: fecha e oculta localmente, sem devolver à fila ou apagar histórico.
13. Para retomar um finalizado, use Reabrir.

## Resultado esperado

Mensagens são enviadas à API e o atendimento é atualizado após confirmação. Sucesso HTTP não é confirmação de entrega ou leitura no WhatsApp.

## Erros e soluções

- Sem fila/sem destinatário elegível: transferência pode ficar indisponível; peça ao admin revisar vínculo.
- Upload falhou parcialmente: veja arquivos restantes; não reenvie todos sem conferir os já enviados.
- Falha de rede em texto: pode ir à fila local; não enviar cópias manualmente enquanto houver pendência.
- Arquivo perigoso, vazio ou grande: escolher outro arquivo permitido.
- Assinatura/filtro: tickets sem responsável continuam elegíveis no filtro por atendente; Meus/Sem atendente mantêm significados próprios.
- Encerrar em lote: conferir total de sucesso e falha; a operação não é única/transacional.

## Observações e limitações

- Recusa oculta por usuário no navegador por sete dias; ticket continua no backend e pode aparecer a outros em Finalizados.
- Pesquisa/histórico limita-se às mensagens retornadas; consulta normal não pagina todo o histórico.
- Transferência usa usuários da primeira página; sem fila fica desabilitada. Qualquer atendente devolve a `pending`; não confundir com Recusar.
- Busca de atendentes para assinatura usa consulta paginada de usuários; seleção só em contexto admin.
- Remover uma etiqueta exclui todas e religa as restantes: pode falhar parcialmente.
- Rascunho e outbox são locais por empresa/ticket, sem anexos; citação não é preservada integralmente na fila.
- Não há idempotência backend comprovada; evite prometer ausência absoluta de duplicação.
- Nome de arquivo vem da URL de mídia, separado da assinatura; permissões da URL dependem do backend.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/tickets/pages/TicketsPage.tsx`, `api.ts`, `attendant-selection.ts`, `refused.ts`, `offline-outbox.ts`, `components/TransferTicketDialog.tsx`, `components/MessageMedia.tsx`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
