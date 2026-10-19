# 7. Segurança e privacidade

## 7.1 Controles presentes

- Access token somente em memória; renovação por cookie enviado com credenciais.
- Guardas de sessão e papéis no frontend, com backend responsável pela autorização real.
- Geração de senha por CSPRNG com rejection sampling, 16 caracteres por padrão; senha gerada apenas em memória de formulário.
- Tratamento central de erros; limpeza de token, sessão, QueryClient e Socket no logout.
- `src/server.ts` adiciona X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS e Permissions-Policy limitando câmera/geolocalização e permitindo microfone da própria origem.
- Páginas autenticadas e sensíveis usam metadados noindex, que **não substituem controle de acesso**.
- Atualização de dependências/overrides registrada no manifesto; esta tarefa não executou nova varredura de vulnerabilidades.

## 7.2 Limitações e verificações prioritárias

| Item                             | Situação                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CORS, HttpOnly/Secure/SameSite   | Configuração do backend; não verificada em execução nesta auditoria                                                  |
| Isolamento multitenant           | Filtros frontend existem, mas não substituem validação backend                                                       |
| Downloads de mídia/backups       | Autorização e exposição das URLs devem ser validadas no backend                                                      |
| Rascunhos/reenvio                | Conteúdo de conversa persiste em localStorage por empresa/ticket; não apenas dados visuais                           |
| Senhas compartilhadas por acesso | Fluxo pode copiar credenciais ou abrir wa.me com texto; transmitir por canal seguro, sem registrar                   |
| CSP                              | Não foi localizada política CSP adicionada em `src/server.ts`                                                        |
| Reenvio idempotente              | Não foi identificado envio do ID local como chave idempotente ao backend                                             |
| GitHub deploy                    | Push main atualiza VPS; script descarta mudanças locais com reset e não tem rollback/ambiente de aprovação explícito |
| Logs                             | Console/PM2 podem conter detalhes técnicos; não publicar logs brutos com dados de clientes                           |
| Backup                           | Dump local não garante cópia externa, recuperação testada ou backup das sessões/mídias                               |

## 7.3 Operações proibidas nesta auditoria

Nenhuma exclusão, reinício, alteração de sessão, edição de permissão, acesso a banco ou restauração. Nenhum segredo foi copiado para a documentação. Não registrar senhas/tokens em exemplos, capturas, console ou changelog.

## 7.4 Segurança da documentação

Documentos administrativos/técnicos devem ser entregues só a pessoas autorizadas. Um ZIP baixado não aplica permissões por papel; seu destinatário pode ler todo o conteúdo. A proposta de Central de Ajuda precisa separar conteúdo público do restrito no servidor, não apenas esconder links.

**Fontes:** `src/shared/auth/`, `src/shared/api/client.ts`, `src/server.ts`, `src/modules/tickets/offline-outbox.ts`, `src/modules/users/access.ts`, `.github/workflows/deploy.yml`.

---

[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
