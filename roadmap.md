# Roadmap

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
