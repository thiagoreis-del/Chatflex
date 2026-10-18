# 8. Mapa de funcionalidades

Status **Implementado** significa implementação frontend encontrada, não certificação de produção. **Parcialmente implementado** tem lacuna concreta; **Não implementado** ausência de tela/ação ou rejeição local; **Não verificado** exige evidência externa/teste autorizado. Não confundir com deploy ou disponibilidade servidor.

| Módulo | Funcionalidade | Status | Perfil autorizado na interface | Observações |
|---|---|---|---|---|
| Acesso | Página pública/planos/login/recuperação/redefinição | Implementado | Público | Telas públicas capturadas; recuperação não foi enviada |
| Acesso | Refresh, logout e acesso delegado | Não verificado | Autenticado; delegado superadmin | Implementação cliente presente; cookie/backend e sessão autenticada não testados |
| Dashboard | Cards/gráficos/TME/TMA/primeira resposta | Parcialmente implementado | Três papéis | Métricas derivadas de tickets, updatedAt aproximação e dependência de campos |
| Atendimento | Abas, busca e filtros | Implementado | Admin/atendente | Código/tela; lista normal não percorre todas as páginas |
| Atendimento | Aceitar, finalizar e reabrir | Não verificado | Admin/atendente | Callers reais identificados, sem escrita executada nesta auditoria |
| Atendimento | Transferência | Parcialmente implementado | Admin/atendente | Mantém fila atual, usuários primeira página; sem fila indisponível |
| Atendimento | Recusar e encerrar em lote | Parcialmente implementado | Admin | Recusa fecha e oculta localmente; lote pode ter sucesso parcial |
| Atendimento | Assinatura de colega | Implementado | Admin | Estado editável independente do draft; auditoria/autoria backend não comprovada |
| Mensagens | Texto, nota, citação, emoji e resposta rápida | Implementado | Admin/atendente | Nota privada usa string true; entrega backend não testada |
| Mensagens | Anexo/áudio/editor/cancelar upload | Implementado | Admin/atendente | 10 arquivos/16MiB; browser e servidor determinam compatibilidade |
| Mensagens | Busca histórica completa | Parcialmente implementado | Admin/atendente | Só mensagens carregadas, sem paginação de histórico no caller |
| Mensagens | Etiquetas | Parcialmente implementado | Admin/atendente | Remoção exclui todas e religa restantes; não atômico |
| Mensagens | Offline/rascunho | Parcialmente implementado | Admin/atendente | Texto local, sem mídia/idempotência/citação completa; depende de painel |
| Avisos | Som/notificação | Parcialmente implementado | Autenticado | Gesto/permissão, dedup/poll/Socket; não Push com app fechado |
| Contatos | Cadastro/edição/exclusão/busca | Implementado | Admin/atendente | Frontend validado estaticamente; servidor não testado |
| Contatos | Importar CSV/TXT | Parcialmente implementado | Admin/atendente | Parser simples e criação sequencial; sem dedup global |
| Contatos | Exportar contatos | Não implementado | — | Nenhum exportador localizado |
| Usuários | Cadastro/edição/exclusão/senha/compartilhar | Implementado | Admin | Ações cliente; senha mínima8, troca obrigatória não comprovada |
| Usuários | Bloqueio/revogação de sessão | Não verificado | Admin | blocked enviado; efeito servidor pendente |
| Filas | CRUD nome/cor/saudação | Implementado | Admin | Campos ocultos preservados após leitura completa |
| Filas | Editor de roteador/escala/integração | Não implementado | — | Campos no contrato não equivalem a editor |
| Respostas rápidas | CRUD e uso no compositor | Implementado | Admin/atendente | Isolamento/disponibilidade geral exigem servidor |
| Chat interno | Direto/grupo/fila, texto/mídia/membros | Não verificado | Admin/atendente | Código presente; instalação relatada pelo usuário no roadmap, sem novo teste |
| Conexões | CRUD/sessão/QR/desconectar | Não verificado | module.connections | Telas/callers identificados, sem alterar sessões |
| Status | Fotos/legendas/lote | Parcialmente implementado | module.status | 20 imagens/700 chars; experimental, visibilidade individual pendente |
| Configuração | Horários/mensagem fora de expediente | Parcialmente implementado | Admin | Várias escritas sem transação; automação backend não verificada |
| Configuração | SLA e alertas | Parcialmente implementado | Admin | Estimativa browser aberto; report remoto pendente |
| Configuração | Agradecimento de encerramento | Não verificado | Admin para configuração | UI presente; falha leitura retorna null; envio real não testado |
| Empresas | Lista/filtros/detalhe | Parcialmente implementado | Superadmin | Filtros pós-página; consumo indisponível |
| Empresas | Cadastro/editar | Parcialmente implementado | Superadmin | Vários campos não persistidos separadamente; password raiz enviada |
| Empresas | Suspender/cancelar/reativar/plano/vencimento | Parcialmente implementado | Superadmin | Motivo descartado; cancelar=suspender; reativar não ajusta vencimento |
| Empresas | Ampliar limites individualmente | Não implementado | Superadmin | Botão exposto, API real rejeita por limites vindos do plano |
| Planos | CRUD/duplicar/comparar/sugeridos | Parcialmente implementado | Superadmin | Anualidade/descrição/storage não enviados; active=isPublic |
| Planos | Flags de recursos | Parcialmente implementado | Superadmin | Flags não comprovam integração/module; alguns mapeamentos divergentes |
| Plataforma | Indicadores comerciais | Parcialmente implementado | Superadmin | Usuários=capacidade; receita não conciliada; trial sem cálculo |
| VPS | Métricas e alertas | Parcialmente implementado | Superadmin | Load normalizado, referência fixa; erros viram null/estimativa |
| VPS | Histórico | Parcialmente implementado | Superadmin | 120 amostras locais; sem histórico servidor |
| VPS | Limiar editável/alerta externo/detalhe por diretório | Não implementado | — | Sem editor/email/WhatsApp/consumo Docker-mídia-log por caminho |
| Assinaturas/Faturas | Consulta e filtros | Não verificado | Superadmin | Contratos /platform pendentes |
| Faturas | Pagamento/Pix/boleto/baixa/estorno | Não implementado | — | Não existem ações de cobrança nessa interface |
| Auditoria | Eventos/histórico/acesso delegado | Não verificado | Superadmin | Callers /platform; persistência/abrangência não comprovadas |
| Backups | Criar/listar/download/restaurar/agenda | Não verificado | Superadmin | Payload assumido; status desconhecido vira completed; sem teste recuperação |
| PWA | Manifesto/SW/móvel | Parcialmente implementado | Usuário | Sem validação do artefato offline/instalação; fallback SSR pendente |
| Relatórios | Menu Relatórios | Não implementado | — | Desabilitado; painéis SLA/indicadores existem separadamente |
| Reservas | automations,campaigns,files,flows,messages,monitoring,reports,roles | Não implementado | — | Pastas reservadas sem módulos próprios; não nega recursos transversais em tickets/VPS |
| Central de Ajuda | Busca/categorias/manuais/tema/acesso | Não implementado | — | Somente proposta solicitada; não criada rota/menu |
| Backend/Banco | Tabelas/RLS/jobs/webhooks/isolamento | Não verificado | Servidor | Fontes não fornecidas; não inferir schema físico |

Fontes por módulo nos [manuais](manual-usuario/introducao.md), [administração](manual-admin/README.md), [API](api.md) e [rotas](rotas.md). Nenhum botão de tela autenticada foi acionado nesta auditoria; ações sem efeito completo estão explicitadas acima.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
