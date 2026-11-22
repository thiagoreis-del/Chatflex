# 8. Publicar Status

**Objetivo:** Solicitar publicação de fotos no Status WhatsApp.
**Quem pode utilizar:** Administrador e atendente por padrão, conforme `module.status` e autorização backend.
**Como acessar:** Publicar Status → `/app/status`.

## Campos e opções

Conexão WhatsApp por QR Code, até 20 fotos JPG, PNG ou WebP de até 8 MB cada e legenda opcional de até 700 caracteres por foto. O público é definido a partir dos contatos elegíveis vinculados ao número, respeitando a privacidade do Status no WhatsApp.

## Passo a passo

1. Escolha o número conectado; se houver só um, pode ser selecionado automaticamente.
2. Adicione as fotos, confira as prévias e escreva as legendas.
3. Use **Publicar agora** para enviar as fotos ou **Agendar** para escolher a data e o horário.
4. Na **Agenda de Status**, escolha o dia para acompanhar ou cancelar publicações pendentes.
5. Se uma publicação ficar sem confirmação, confira o Status no celular antes de adicionar a foto novamente.

## Resultado esperado

As fotos são enviadas em sequência. O módulo retira da fila cada foto aceita pelo servidor do WhatsApp. A visualização depende da elegibilidade de cada destinatário.

## Erros e soluções

Se o número estiver desconectado no horário agendado, o sistema tenta publicar por até 15 minutos. Confira o estado de cada foto na agenda.

## Observações e limitações

Cada foto mantém seu próprio estado. A confirmação de publicação indica que o WhatsApp aceitou a foto. A visualização por destinatário é verificada no celular.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/whatsapp/pages/StatusPublishPage.tsx`, `status.ts`, `src/test/whatsapp-status.test.ts`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
