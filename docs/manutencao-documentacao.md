# 15. Estratégia de manutenção

## 15.1 Fonte e processo

Documentação em `docs/`, revisada junto com cada alteração relevante. Não tratar README antigo ou flags `confirmed` como única verdade: conferir chamadores, tipos, testes e execução autorizada.

Para cada alteração: atualizar manual/matriz/API afetados; registrar data, módulo, descrição, impacto ao usuário, impacto técnico e versão/commit; conferir links; revisar segredo e permissões; solicitar aprovação; só então publicar conforme fluxo da equipe.

## 15.2 Versão

A versão 1.0.0 identifica **esta documentação**, não a aplicação nem a biblioteca Lovable. Atualizações editoriais compatíveis podem incrementar patch; novos módulos/regras exigem revisão de conteúdo e versão apropriada. Não inventar release histórico com base em mensagens antigas.

## 15.3 Ficha de alteração

| Campo           | Preencher                                                        |
| --------------- | ---------------------------------------------------------------- |
| Data            | Data real da alteração                                           |
| Módulo          | Área afetada                                                     |
| Funcionalidade  | Adicionada, modificada ou retirada                               |
| Impacto usuário | O que muda na operação                                           |
| Impacto técnico | Rotas, contratos, configuração ou dependências                   |
| Versão          | Release real ou commit confirmado                                |
| Evidência       | Arquivos, testes e validação autorizada                          |
| Estado          | Código identificado / teste local / produção validada / pendente |

## 15.4 Verificações sugeridas

Links relativos, presença de fonte, status consistente, nenhuma credencial/dado de cliente, rotas ainda existentes, campos coerentes, capturas atualizadas sem dados reais, Mermaid renderizável. Um futuro check automatizado de docs deve rodar no CI sem publicar sozinho; não foi alterado o CI nesta tarefa.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
