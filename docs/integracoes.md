# 6. Integrações e processos

| Integração                 | Implementação observada                                                      | Limite                                          |
| -------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| API externa                | VITE_API_URL; default api.notasflex.com.br                                   | Backend não fornecido                           |
| Socket.IO                  | Namespace por empresa, websocket/polling, reconexão 1–30 s, salas reentradas | Token/userId na query; risco de logs            |
| WhatsApp                   | CRUD conexões, whatsappsession e mídia/status via API                        | Sem motor WhatsApp no repositório               |
| CNPJ                       | GET BrasilAPI /api/cnpj/v1/:cnpj via fetch                                   | Não consultada nesta auditoria                  |
| Compartilhar acesso        | Abre wa.me por ação explícita                                                | Não envio backend; inclui credenciais sensíveis |
| Notification API/Web Audio | Permissão/gesto do usuário; polling + Socket deduplicados                    | Não Web Push com app fechado                    |
| Backups/métricas           | Callers remotos                                                              | Não scripts/cron de servidor localizados        |
| Publicação frontend        | Workflow GitHub SSH/PM2                                                      | Não executado; push main dispara atualização    |

## 6.1 Eventos e tarefas do navegador

Eventos company-:id-ticket/appMessage/contact/whatsapp/whatsappSession invalidam cache. Polling complementa Socket. Conexões 15 s; QR 2,5 s; notificações 5 s; indicadores operação 30 s; plataforma 60 s; métricas VPS 30 s; SLA diário 60 s; backup em execução 5 s.

Probe /health no-cors, sem credenciais: 15 s normal, 5 s recuperação, timeout8s; duas falhas e ausência de tráfego recente antes de offline. Resposta opaca comprova alcançabilidade, não saúde funcional/status2xx.

Rascunho cf-draft:empresa:ticket e outbox cf-outbox:empresa guardam texto/contexto parcial local. Reenvio sequencial no ticket aberto, para na falha; sem anexos, Background Sync ou idempotency key comprovada. Não há TTL/segregação por usuário identificado para esses textos.

## 6.2 PWA e móvel

SW manual /sw.js, escopo /; recusado em dev/iframe/hosts preview. NetworkFirst para navegação e CacheFirst para assets com hash; sem cache explícito de API. ?sw=off tenta desregistrar sem limpar todos os caches. Fallback /index.html exige validação no artefato SSR. Instalação/atualização/offline de produção não foram testados.

AppShell controla altura dinâmica e rolagem; tabelas/abas rolam localmente e atendimento adapta painéis. Câmera, microfone, notificação e clipboard dependem de navegador/permissão/HTTPS; não foi feita validação autenticada em celular nesta auditoria.

## 6.3 Não encontrados

Não foram localizados implementações de webhooks de negócio, Edge Functions Supabase, jobs de banco, SMTP, gateway de pagamento ou servidor de WhatsApp. Flags de plano para Facebook/Instagram/IA/API/automações não comprovam essas integrações.

**Fontes:** src/shared/socket/_, connectivity/_, pwa/_; src/modules/tickets/_; vite.config.ts; módulos de API; .github/workflows/deploy.yml.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
