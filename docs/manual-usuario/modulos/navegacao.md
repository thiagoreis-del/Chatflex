# 3. Navegação, aparência e celular

**Objetivo:** acessar os módulos e preferências. **Quem:** usuário autenticado; módulos dependem do perfil.

1. No computador, escolha o módulo no menu lateral.
2. No celular, abra o menu pelo ícone do cabeçalho, escolha o módulo e feche o painel.
3. Use o seletor de aparência para Claro, Escuro ou Sistema. A preferência permanece neste navegador.
4. Abra o menu do perfil para conferir nome, e-mail, empresa e papel. Ele não é um editor de perfil.
5. O seletor de idioma oferece apenas pt-BR no código atual.

## 3.1 Instalação PWA

O sistema tem manifesto e ícones de aplicativo, Apple/Safari e desktop. Em navegador compatível, use a opção nativa de instalar/adicionar à tela inicial. A presença do manifesto não garante instalação em todos os navegadores; essa auditoria não testou dispositivos físicos nem a versão PWA da VPS.

## 3.2 Conexão e avisos

Internet, API, WebSocket e WhatsApp são condições diferentes. Uma queda de WebSocket sozinha não deve mostrar aviso de internet. O sistema verifica alcance da API e remove o aviso quando volta a receber resposta. Se persistir, veja [diagnóstico](../../troubleshooting/conectividade.md).

## 3.3 Notificações

O sino e controles de som/notificações pertencem aos alertas de novas mensagens. Autorize notificações apenas no seu equipamento; áudio precisa de interação e permissão do navegador. Não há garantia de notificação push com aplicação completamente fechada. Evite equipamentos compartilhados devido a rascunhos locais.

## 3.4 Limitações

Relatórios em “Em breve” não é um link funcional. Algumas tabelas rolam horizontalmente em telas pequenas. Microfone, arquivos, teclado e avisos no iOS/Android precisam de validação real.

**Captura pendente:** menu aberto, seletor de tema, perfil e sino em empresa de teste, sem dados pessoais.
**Fontes:** `AppShell.tsx`, `shared/components/preferences.tsx`, `shared/theme/theme.ts`, `shared/pwa/register-sw.ts`, `public/manifest.webmanifest`.

---

[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
