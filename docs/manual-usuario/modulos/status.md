# 8. Publicar Status

**Objetivo:** Solicitar publicação de fotos no Status WhatsApp.
**Quem pode utilizar:** Administrador e atendente por padrão, conforme `module.status` e autorização backend.
**Como acessar:** Publicar Status → `/app/status`.

## Campos e opções

Conexão WhatsApp por QR Code, até 20 fotos JPG, PNG ou WebP de até 8 MB cada, legenda opcional de até 700 caracteres por foto e público de até 100 contatos.

## Passo a passo

1. Escolha o número conectado; se houver só um, pode ser selecionado automaticamente.
2. Busque os contatos que podem ver as fotos e selecione o público.
3. Adicione as fotos, confira as prévias e escreva as legendas.
4. Clique em **Publicar no Status** e aguarde a confirmação de cada foto.
5. Se uma foto ficar sem confirmação, confira o Status no celular antes de adicioná-la novamente.

## Resultado esperado

As fotos são enviadas em sequência. O módulo retira da fila cada foto aceita pelo servidor do WhatsApp. A visualização depende da elegibilidade de cada destinatário.

## Erros e soluções

Se o número desconectar, reconecte-o e publique as fotos que ainda faltam. Se o WhatsApp recusar o público, revise os contatos selecionados.

## Observações e limitações

Cada foto é enviada à conexão escolhida com a legenda e os IDs dos contatos. A confirmação indica que o WhatsApp aceitou a publicação. A visualização por destinatário é verificada no celular.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/whatsapp/pages/StatusPublishPage.tsx`, `status.ts`, `src/test/whatsapp-status.test.ts`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
