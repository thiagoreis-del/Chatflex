# 8. Deploy e atualização

## 8.1 Automação realmente existente
`.github/workflows/deploy.yml` dispara em push para `main` ou execução manual. Usa `appleboy/ssh-action@v1.2.0`, segredos `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, porta 22, timeout de 15 minutos e concorrência sem cancelar execução anterior.

Na VPS, o script: acessa `/var/www/chatflex-frontend`; busca origin/main; aplica `git reset --hard origin/main`; instala com npm e legacy-peer-deps; compila com `NITRO_PRESET=node-server`; recarrega `chatflex-frontend` no PM2; verifica HTTP local na porta 3001. A auditoria apenas leu o workflow: não o executou.

## 8.2 Aviso operacional
**Qualquer push para main, mesmo só de docs, dispara o fluxo.** Não há filtro de caminhos, gate de aprovação por environment ou dependência explícita de sucesso do CI no workflow de deploy. A serialização de deploys não impede uma versão com falha de ser tentada. Estes são fatos do workflow, não mudanças propostas executadas.

`git reset --hard` sobrescreve arquivos rastreados na VPS; ajustes manuais podem ser perdidos. O script não faz staging de artefato, backup automático da versão anterior ou rollback explícito. Uma falha de build pode deixar o repositório avançado sem recarregar a aplicação. O teste local comprova apenas resposta HTTP, não login, envio ou permissões.

## 8.3 CI separado
`.github/workflows/ci.yml` roda em pull request e push main: checkout, Bun, instalação frozen-lockfile, lint, typecheck e build. Testes Vitest existem, mas não aparecem nesse CI.

## 8.4 Revisão recomendada (não implementada)
Branch de revisão → testes e preview com ambiente seguro → aprovação → merge main → acompanhar Actions → conferir HTTPS e login numa conta autorizada. A publicação da biblioteca Lovable e sua versão semântica não equivalem ao deploy VPS. O código analisado não possui versão de produto no rodapé; use commit/run para rastrear implantação.

## 8.5 Infraestrutura relatada anteriormente
Frontend Node/Nitro em 3001 via PM2; proxy Nginx para chatbotflex.com.br e www; backend externo api.notasflex.com.br mantido separado. Esses detalhes constam no histórico de implantação, não em configuração Nginx/PM2 versionada lida nesta auditoria. Certificado, DNS, versões, permissões e processos atuais precisam de verificação externa.

## 8.6 Checklist após atualização autorizada
Conferir Actions verde, resposta HTTPS, cabeçalhos, login/refresh, navegação, carregar mensagens, envio em conta/número de teste, anexos/áudio e PWA. Não reiniciar backend/WhatsApp para uma atualização só do frontend sem necessidade/autorização.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
