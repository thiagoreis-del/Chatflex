# 3. Instalação e ambientes

## 3.1 Pré-requisitos

Git, gerenciador Bun ou npm e Node compatível com as dependências atuais. O histórico da implantação registrou incompatibilidade com Node 20; adotar Node 22.12 ou superior compatível e conferir `engines` das dependências antes de atualizar uma VPS. A versão efetivamente instalada na VPS não foi consultada agora.

## 3.2 Desenvolvimento

Execute separadamente em uma cópia de desenvolvimento: `bun install`, configure `.env` a partir de `.env.example`, depois `bun run dev`. Scripts disponíveis: `test`, `test:watch`, `lint`, `typecheck`, `build`, `build:dev`, `preview` e `format`.

`format` altera arquivos; não faz parte de uma auditoria de leitura. `typecheck` do projeto usa `tsc --noEmit`; a ferramenta de trabalho pode usar `tsgo` para validação TypeScript. O CI atual executa lint, typecheck e build, mas não inclui o script de testes.

## 3.3 Variáveis públicas

| Variável          | Uso                                            |
| ----------------- | ---------------------------------------------- |
| `VITE_API_URL`    | Origem HTTPS da API externa                    |
| `VITE_SOCKET_URL` | Origem do Socket.IO                            |
| `VITE_APP_NAME`   | Nome comercial mostrado                        |
| `VITE_APP_URL`    | URL do frontend, inclusive mensagens de acesso |
| `VITE_USE_MOCKS`  | Somente a string `true` habilita demonstração  |

Toda variável `VITE_` é incorporada ao navegador: nunca colocar senhas, tokens, credenciais de banco ou chave SSH. O build lê a configuração; mudar `.env` exige reconstrução para valores incorporados.

## 3.4 Revisão sem produção

Use branch separada e frontend de revisão. Para testar escrita com segurança, a API também precisa ser de teste, ou uma empresa/número de teste com autorização: o Preview apontando à API de produção pode alterar dados reais. Mocks devem ser habilitados explicitamente e não validam contratos reais.

## 3.5 Configuração pendente

Cabeçalhos CORS, cookie de renovação, portas, PM2, Nginx, TLS, cron e segredos GitHub pertencem à infraestrutura externa; não são configurados só por `.env.example`. Não expor `.env` em capturas, commits ou logs.

**Fontes:** `.env.example`, `src/shared/config/env.ts`, `package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
