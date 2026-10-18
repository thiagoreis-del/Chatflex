# 10. Configurações, SLA e agradecimento

**Objetivo:** Ajustar horário e mensagens automáticas da empresa.
**Quem pode utilizar:** Administrador da empresa e superadmin.
**Como acessar:** Configurações → `/app/configuracoes`; agradecimento também é reutilizado em Respostas rápidas conforme montagem atual.

## Campos e opções
Dias ativos/inativos, início/fim, copiar primeiro, restaurar padrão, mensagem fora de expediente; SLA; agradecimento com botão próprio.

## Passo a passo
1. Ative os dias de funcionamento e informe início anterior ao fim.
2. Copie horário do primeiro dia ativo quando necessário ou restaure o padrão.
3. Se ligar mensagem fora do expediente, preencha o texto (até 1.000 caracteres) e Salvar.
4. Para SLA, habilite e defina aviso, urgência e violação em ordem crescente e positiva; configure som, desktop, supervisores, feriados e expediente.
5. Salve o SLA separadamente; teste som com gesto/permissão do navegador.
6. Para agradecimento, ligue/desligue, preencha até 1.000 caracteres e use o seu botão Salvar.
7. Antes de usar com clientes, finalize um atendimento de teste autorizado e confira se mensagem e assinatura estão corretas.

## Resultado esperado
Configuração enviada às APIs da empresa; envio efetivo de mensagem/automação depende do backend e, para estimativas de SLA, do navegador aberto.

## Erros e soluções
Início >= fim → corrigir; mensagem habilitada vazia → preencher; SLA fora de ordem → ajustar. Falha parcial em horários/conexões → conferir antes de repetir, pois são várias escritas.

## Observações e limitações
Padrão de horário no código: dias úteis 08–18h, America/Sao_Paulo. SLA padrão desligado, 2/3/5 minutos, quatro tons e volume configurável; não é monitoramento contínuo independente do navegador. Reativação usa enabledAt para não alertar retroativamente. O editor de escala oferece uma faixa por dia. Lista de supervisores usa primeira página. Persistência de agradecimento/SLA pode retornar defaults/null em falha, ocultando indisponibilidade.

**Captura interna pendente:** registrar esta tela com empresa/usuários de teste, sem mensagens, telefone, e-mail ou credenciais de pessoas reais.
**Evidências:** `src/modules/settings/*`, `src/modules/sla/sla.ts`, `src/modules/sla/components/SlaSettingsCard.tsx`.

---
[Voltar ao sumário](../../README.md) · Documentação 1.0.0 · 18/10/2026
