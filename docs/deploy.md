# 8. Deploy e atualização

## Atualização em 19/10/2026 — compilação no GitHub

O workflow foi alterado para a opção 1: instalar com Bun e lockfile congelado, executar testes, compilar para Node 22 no GitHub e enviar o pacote pronto por SCP. O pacote contém `.output`, `node_modules` e `package.json`, pois imports externos do Nitro podem precisar de dependências em execução. A VPS não executa mais fetch/reset, instalação ou build. Alterações exclusivamente em Markdown ou `docs/` não disparam deploy; execução manual continua disponível em **Actions → Deploy VPS → Run workflow**.

**Preparado no repositório; execução real ainda não verificada.** A edição sincronizada com `main` pode disparar a automação. Não foi aberta conexão SSH nem executado workflow nesta tarefa. As seções 8.1–8.5 abaixo registram o fluxo anterior auditado, não o novo script.

### Requisitos para a primeira execução
- GitHub conectado à branch `main` e segredos existentes `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` válidos. O editor atual não oferece acesso ao status desses segredos ou das execuções privadas do GitHub.
- VPS Linux x64, Node **22.12+ da série 22**, Bash, PM2, curl, tar e sha256sum; permissão de escrita em `/var/www/chatflex-frontend`.
- PM2 `chatflex-frontend` deve apontar para `/var/www/chatflex-frontend/.output/server/index.mjs`; o script aborta antes da troca se não corresponder. A porta permanece 3001 e o ambiente PM2 existente é preservado.
- As configurações públicas agora são definidas no momento da compilação via **GitHub Settings → Secrets and variables → Actions → Variables** (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_APP_NAME`, `VITE_APP_URL`), com os padrões de `.env.example`. Um `.env` existente na VPS não altera o pacote já compilado. `VITE_USE_MOCKS` é forçado a `false`; nunca coloque segredos nas variáveis `VITE_`.

### Ativação e recuperação
`scripts/deploy-vps.sh` confere checksum, extrai em `releases/<run>-<attempt>`, verifica o commit e preserva a `.output` anterior. Troca `.output` por um link para a nova versão e recarrega somente o frontend. Valida HTTP local e o commit em `/deploy-version.json`; se reload ou validação local falhar, restaura a saída anterior e tenta recarregar PM2. Essa recuperação não garante disponibilidade sem interrupção e uma falha no próprio PM2 exige intervenção.

Em seguida, GitHub verifica a mesma identificação no endereço HTTPS público e registra o commit no resumo da execução. Falha nessa verificação pública sinaliza erro, mas não desfaz automaticamente a versão local validada (pode ser cache/proxy/DNS). Esse arquivo comprova a versão servida, não o funcionamento autenticado, envio WhatsApp ou backend. O service worker de clientes já abertos também pode demorar a atualizar.

As versões anteriores e os pacotes ficam preservados na VPS: **não há limpeza automática** nesta primeira configuração. Monitore espaço e faça limpeza autorizada depois de confirmar estabilidade; não apague destinos de links ativos. O artefato do GitHub expira em sete dias.

### Validação realizada
Testes locais isolados do script cobrem ativação, preservação da versão anterior, recuperação por falha HTTP e recusa por checksum inválido. Usam substitutos de PM2/curl e não executam a VPS. A compilação Node completa, a compatibilidade com a VPS e o primeiro deploy real dependem de uma execução do GitHub; não estão certificados por esses testes.

## 8.1 Automação realmente existente
**Histórico anterior à alteração de 19/10/2026:**
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
