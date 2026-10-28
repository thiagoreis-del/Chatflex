# Roadmap

## Contatos compartilhados — 28/10/2026

- [ ] Adicionar Conversar em cada contato compartilhado, reutilizando atendimento existente ou iniciando pela conexão escolhida.
- [ ] Validar regras de número, reutilização e criação; teste real depende de sessão do backend externo.

## Atualização dos atendimentos — 19/10/2026

- [x] Corrigir atualização automática: consulta a cada 3 segundos, recuperação ao voltar à janela e invalidação por eventos; 13 testes passaram e preview compilou.
- [ ] Confirmar atualização em sessão real — bloqueado por ausência de sessão autenticada do backend externo; publicação desta correção na VPS não confirmada.

## Atualizações da VPS — opção 1

- [x] Configurar compilação e testes no GitHub; envio do pacote pronto para a VPS.
- [x] Implementar troca de versão com backup, verificação local e recuperação automática.
- [x] Documentar requisitos e validar o script isoladamente (70 testes passaram; sem deploy remoto).
- [x] Confirmar execução real: deploy automático confirmado em 22/10/2026 — commit `8293b43` chegou à VPS via workflow `deploy.yml` (CSS publicado já contém as classes exclusivas do commit) sem ação manual.

## Documentação solicitada em 18/10/2026

- [ ] Auditar o código em somente leitura e apresentar inventário.
- [ ] Gerar documentação técnica e manuais em `docs/` com evidências e limitações.
- [ ] Propor Central de Ajuda sem implementar ou publicar.
- [ ] Validar links e pacote de documentação; entregar relatório de cobertura.

## Concluído

- Saída da empresa: restauração administrativa em memória retorna com sucesso, sem logout por estado antigo da tela.
- Cadastro de empresa: senha inicial e confirmação validadas; senha enviada no campo exigido por POST /companies.
- Etapa 1 — Abas de atendimento com cores/ícones/contadores, cabeçalho da conversa com Empresa/Conexão/Fila/Atendente e botão Finalizar em destaque.
- Etapa 2 — PWA: manifesto, ícones, service worker (produção, NetworkFirst), aviso offline, rascunho e fila de envio offline de mensagens de texto.
- Etapa 3 — Chat interno da empresa: página `/app/chat-interno` (direto/grupo/fila, menções, anexos, áudio), link no menu, namespace i18n.

## Concluído pelo usuário na VPS

- Rota de Status `POST /whatsapp/:id/status/test-batch` instalada e protegida (401 sem login).
- Backend do chat interno: usuário confirmou criação de conversas e troca de mensagens após instalar as rotas.

## Em andamento

- Ajustar filtro de atendentes e assinatura automática sem ocultar aguardando sem responsável.
- Publicação de Status — tela `/app/status` pronta; aguarda teste real com fotos (nome do campo de legendas `captions` a confirmar no controller).
