# 14. Proposta — Central de Ajuda e Documentação

**Status: proposta, não implementada.** Nenhuma rota, menu, busca, permissão ou dado novo foi criado.

## 14.1 Objetivo

Disponibilizar os manuais verificados dentro do sistema, sem misturar orientação de clientes com documentação de manutenção.

## 14.2 Conteúdo e experiência propostos

- Busca por palavras-chave em títulos/conteúdo permitido ao perfil, incluindo nomes dos botões.
- Categorias: Acesso, Atendimentos, Contatos, Respostas rápidas, Chat interno, Status, Administração da empresa e Plataforma.
- Tutoriais curtos com objetivo, perfil, acesso, campos, passos, resultado e soluções.
- Perguntas frequentes baseadas em problemas reais; referências cruzadas para detalhes.
- Histórico de atualização a partir do changelog, sem versões históricas inventadas.
- Tema claro/escuro herdado do sistema, busca e leitura adaptadas a celular/desktop.
- Impressão/exportação de manual permitido ao usuário; avaliar ferramenta Markdown/Mermaid em etapa separada.

## 14.3 Separação de acesso proposta

| Conteúdo                            | Público proposto                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Manual operacional geral            | Usuários autenticados                                                               |
| Administração da empresa            | Administrador da empresa/superadmin                                                 |
| Gestão da plataforma                | Superadmin                                                                          |
| Documentação técnica e operação VPS | Pessoas técnicas explicitamente autorizadas, não todo administrador automaticamente |

O servidor deve verificar autorização antes de entregar conteúdo restrito. Não enviar todos os artigos restritos no bundle público e esconder por CSS/menu. Busca, cache, exportação e URLs diretas devem obedecer à mesma regra; nenhum artigo pode conter credenciais.

## 14.4 Estratégia de conteúdo

`docs/` seria a fonte editorial versionada; um catálogo separaria slug, título, módulo, perfil, revisão, estado de validação e referências. A implementação deverá avaliar o backend externo, não criar outro banco ou habilitar serviço sem autorização.

## 14.5 Critérios de aceite futuros

Busca não retorna conteúdo de outro perfil; links diretos protegidos; cliente identifica campos/botões reais; sem dados sensíveis em captura/cache; leitura/tema funcionam no celular; versão/revisão visível; atualização não depende de edição duplicada. Implementação exige nova autorização.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
