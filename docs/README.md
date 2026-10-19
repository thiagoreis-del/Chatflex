# ChatbotFlex — Documentação do sistema

**Versão da documentação:** 1.0.0 · **Data:** 18/10/2026 · **Base analisada:** `25bfeaf`.

Esta é a documentação do sistema existente, não uma especificação de um sistema novo. O nome comercial observado é ChatbotFlex; o nome mostrado pela interface depende de `VITE_APP_NAME`.

## 1. Escopo e confiabilidade

Auditoria de leitura do código do frontend, rotas, formulários, adaptadores de API, permissões de apresentação, configuração, testes e automação presentes neste repositório. Capturas reais das páginas públicas do ambiente local, sem login e sem envio de dados.

**Não foram acessados:** código-fonte do backend externo, PostgreSQL, Redis, painel da VPS, contas autenticadas ou sessões WhatsApp. Nenhum endpoint de escrita foi executado. Contratos declarados como confirmados no código não equivalem a testes de produção nesta auditoria.

| Classificação | Significado |
|---|---|
| Implementado | Código, tela e ação identificados no frontend. Não certifica funcionamento em produção. |
| Parcialmente implementado | Parte identificada, com dependência, limitação ou fluxo incompleto comprovado. |
| Não implementado | Apenas reserva de pasta/README, sem tela ou ação identificada. |
| Não verificado | Depende de evidência que não está no repositório ou não foi acessada. |

## 2. Sumário

1. [Visão geral](visao-geral.md)
2. [Arquitetura](arquitetura.md) e [instalação](instalacao.md)
3. [Banco de dados](banco-de-dados.md)
4. [Autenticação](autenticacao.md) e [permissões](permissoes.md)
5. [Integrações](integracoes.md) e [catálogo de API](api.md)
6. [Segurança](seguranca.md)
7. [Deploy](deploy.md) e [backup/recuperação](backup.md)
8. [Mapa de funcionalidades](mapa-funcionalidades.md)
9. [Manual do usuário](manual-usuario/introducao.md)
10. [Manual administrativo](manual-admin/README.md)
11. [Fluxogramas](fluxogramas/README.md)
12. [Problemas e soluções](troubleshooting/README.md)
13. [Proposta de Central de Ajuda](central-ajuda-proposta.md)
14. [Atualização da documentação](manutencao-documentacao.md) e [changelog](changelog.md)
15. [Relatório final e pendências](relatorio-final.md)

## 3. Leitura por público

- **Cliente/atendente:** manual do usuário e problemas e soluções.
- **Administrador da empresa:** manual do usuário, permissões e manual administrativo da empresa.
- **Superadministrador:** manuais administrativos da plataforma, monitoramento e backup.
- **Desenvolvedor autorizado:** arquitetura, API, autenticação, segurança e diagramas.

Os arquivos técnicos deste repositório não são uma área autenticada. Restrinja o acesso ao repositório/arquivo exportado; não sirva toda a pasta `docs` publicamente.

## 4. Formatos

Conteúdo em Markdown UTF-8, com links relativos, tabelas e diagramas Mermaid. Compatível com conversão posterior a HTML/PDF por uma ferramenta que suporte Mermaid. Nenhum conversor, rota de ajuda ou exportador novo foi instalado. As capturas públicas estão em `assets/`; telas internas possuem referências de captura pendente, sem imagens inventadas.

## 5. Precaução de publicação

Em 19/10/2026, o workflow foi atualizado para compilar no GitHub e enviar o pacote à VPS; alterações exclusivamente em Markdown ou `docs/` não disparam deploy. Mudanças de código sincronizadas com `main` ainda podem acionar a automação. Não foi executado SSH ou workflow remoto nesta tarefa; a primeira execução real permanece não verificada. Consulte [deploy.md](deploy.md) para requisitos, recuperação e limites da verificação.