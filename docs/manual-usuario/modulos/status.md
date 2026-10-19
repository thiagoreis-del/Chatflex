# 8. Publicar Status

**Objetivo:** Solicitar publicação de fotos no Status WhatsApp.
**Quem pode utilizar:** Administrador e atendente por padrão, conforme `module.status` e autorização backend.
**Como acessar:** Publicar Status → `/app/status`.

## Campos e opções

Conexão CONNECTED; até 20 imagens; legenda opcional de até 700 caracteres por imagem; remover, limpar e publicar; progresso.

## Passo a passo

1. Escolha o número conectado; se houver só um, pode ser selecionado automaticamente.
2. Adicione imagens e confira suas prévias.
3. Escreva legendas opcionais e remova imagens indevidas.
4. Clique Publicar e aguarde o resultado antes de tentar novamente.
5. Em teste autorizado, confirme a visibilidade do Status com destinatário elegível; resultado de upload não basta.

## Resultado esperado

Envio multipart ao endpoint experimental; entrega/visibilidade individual não foi verificada.

## Erros e soluções

Nenhuma conexão conectada → pedir ao administrador conferir, sem desconectar sessões. Mais de 20/não imagem → corrigir seleção. Falha de API → confirmar contrato e resultado real antes de reenviar.

## Observações e limitações

Campos enviados: arquivos repetidos `file` e `captions` JSON. Não há vídeo, agendamento, seleção múltipla de números nem relatório individual nessa tela. Não há limite local de tamanho por imagem identificado. Histórico informa problemas de visibilidade; não classificar como plenamente validado só porque a API aceitou o envio.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/whatsapp/pages/StatusPublishPage.tsx`, `status.ts`, `src/test/whatsapp-status.test.ts`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
