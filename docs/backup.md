# 9. Backup e recuperação

## 9.1 Duas coisas distintas
1. **Tela de Backups:** adaptador de `/backups`, criação, download, agendamento e restauração; formato assumido no código. Sua ligação com a rotina da VPS não foi demonstrada.
2. **Rotina VPS relatada em 18/10/2026:** dump PostgreSQL compactado diário às 03:00, diretório `/home/deploy/notasflex/backups`, retenção de sete dias e arquivos com data/hora. Script/cron não estão neste repositório, por isso não foram reinspecionados.

O guia anterior em Files registra um dump de aproximadamente 119 MB e `gzip -t` bem-sucedido. Isso comprova integridade da compactação naquela ocasião, **não restauração bem-sucedida, schema completo ou integridade de todas as relações**.

## 9.2 Cobertura e riscos
Dump do banco não necessariamente inclui mídia em disco, credenciais/sessões WhatsApp, configuração de serviços, variáveis de ambiente ou certificados. Cópia no mesmo servidor não protege de perda total da VPS. Retenção por idade não equivale a exatamente sete arquivos. Fuso do cron, execução diária, disco livre, sucesso dos últimos backups e cópia externa precisam ser verificados.

## 9.3 Procedimento seguro de recuperação (somente referência)
1. Obter autorização e janela de manutenção; definir quais dados precisam ser recuperados.
2. Escolher backup e verificar integridade; preservar uma cópia atual antes de substituir qualquer coisa.
3. Inspecionar como o dump foi gerado (plain SQL, clean/create, roles/extensões) e compatibilidade PostgreSQL.
4. Restaurar primeiro em banco isolado de teste e parar diante de qualquer erro SQL.
5. Validar contagens, vínculos, amostras de mensagens/atendimentos e requisitos de sessão/mídia.
6. Planejar substituição controlada do banco de produção e rollback, suspendendo gravações somente com autorização.
7. Validar aplicação e WhatsApp após liberação, sem reconectar sessões automaticamente por suposição.

**Não executar genericamente gunzip | psql sobre o banco atual.** Um dump sem limpeza pode gerar `already exists` e conflitos, deixar dados parciais ou não substituir os dados como esperado. Não ignorar esses erros. Parar/religar processo não certifica que a restauração é válida. Restaurar histórico pode perder alterações posteriores ao backup, conforme a estratégia escolhida.

## 9.4 Observação sobre o guia anterior
O guia operacional anterior descrevia uma aplicação direta no banco existente e sugeria ignorar certos erros. Esta documentação não repete essa orientação como procedimento validado: o formato SQL e a restauração não foram testados. Nenhum arquivo anterior foi apagado ou alterado. Solicitar revisão guiada antes de usá-lo em produção.

## 9.5 Verificações não destrutivas futuras
Listar backups, verificar arquivo compactado, examinar agendamento e logs sem credenciais. Executar um comando por vez e aguardar resultado. Não apresentar comandos destrutivos prontos sem identificar banco/dump e ter autorização específica.

**Fontes:** `src/modules/backup/api.ts`, `src/modules/backup/pages/BackupsPage.tsx`; histórico e guia de restauração pré-existente, identificados como evidência histórica e não inspeção atual da VPS.

---
[Voltar ao sumário](README.md) · Documentação 1.0.0 · 18/10/2026
