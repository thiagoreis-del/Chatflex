# 4. Visão da plataforma e Saúde da VPS

**Objetivo:** Acompanhar empresas, conexões e recursos do servidor.
**Quem pode utilizar:** Superadmin.
**Como acessar:** Plataforma → Visão geral → seção Saúde da VPS.

## Campos e opções
Empresas/status, receita/prevista, usuários, conexões, faturas; VPS CPU, RAM, disco, uptime, dados do sistema, Redis/Wuzapi e conectividade; histórico local.

## Passo a passo
1. Clique Atualizar quando necessário e confira horário da coleta.
2. Consulte empresas vencidas/próximas/recentes e abra o detalhe pelos links.
3. Observe consumo VPS somente quando a API retornou métricas válidas.
4. Separe conexão CONNECTED de aguardando QR/pareando e desconectada.
5. Leia Não configurado/Desconhecido como diferentes de Offline.
6. Se houver alerta, peça diagnóstico autorizado; não apague mídia/logs nem reinicie serviços por suposição.

## Resultado esperado
Indicadores derivados dos dados retornados; não uma auditoria financeira ou medição completa do servidor.

## Erros e soluções
/server-metrics falhou → seção converte em null e pode mostrar estimativas/zeros; não interpretar 0% como saudável. Dados de planos/conexões/faturas falharam → dashboard pode zerar parcial silenciosamente. Desconhecido exige validar contrato, não reiniciar Wuzapi.

## Observações e limitações
Referência fixa 4 núcleos/8 GB/100 GB, não autodetecção completa. CPU visual é load1m/núcleos×100 limitada a 100, não utilização medida. Memória/disco dependem de valores backend.
Limiar visual: CPU atenção 70/crítico80, RAM75/85, disco80/90, conexões36/40. **Não há editor configurável desses limites.** Histórico até120 amostras em React (~1h), perdido ao remontar; não é histórico durável backend. Não há consumo por partição/logs/mídia/Docker/backups/temporários.
Usuários globais soma capacidade de planos, conexões contratadas conta registros; receita soma preço de ativos, não pagamentos; trial não incrementado no modo real. Cartão offline pode incluir QR (total−online), apesar de agregador separar estados.
Serviço WhatsApp realmente usado não é comprovado no repo: existe campo wuzapi e normalização, mas não implementação do backend. Não configurado é neutro. Indicador WhatsApp agregado online se ao menos uma conexão está online, não todos os números. Alertas não são enviados por e-mail/WhatsApp.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/platform-admin/api.ts`, `vps-health.ts`, `components/VpsHealthSection.tsx`, `pages/PlatformDashboardPage.tsx`.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
