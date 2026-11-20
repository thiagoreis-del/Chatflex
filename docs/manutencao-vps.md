# Manutenção automática da VPS

O workflow `VPS Maintenance` executa a cada 15 minutos e também pode ser iniciado
manualmente pela aba Actions do GitHub. Ele reutiliza os segredos SSH do deploy:
`VPS_HOST`, `VPS_USER` e `VPS_SSH_KEY`.

## Verificações

- uso do disco raiz, memória disponível e carga por núcleo;
- estado e resposta HTTP do `chatflex-frontend`;
- estado e resposta HTTP do `notasflex-backend`;
- validade do certificado de `chatbotflex.com.br`;
- necessidade de reinicialização do Ubuntu.

## Reparos permitidos

Quando um processo está fora do ar ou não responde localmente, o workflow tenta
um único `pm2 restart`. Um marcador em `/var/tmp` impede outra tentativa automática
para o mesmo processo durante uma hora. Depois do reinício, processo e HTTP são
verificados novamente.

O workflow não reinicia a VPS, não instala atualizações, não remove arquivos e não
altera banco de dados. Disco crítico, certificado próximo do vencimento ou serviço
que continua indisponível fazem a execução falhar e geram o alerta padrão do GitHub.

## Operação

Abra **GitHub → Actions → VPS Maintenance** para consultar o histórico ou executar
uma verificação imediata. Logs não incluem senhas, tokens nem conteúdo de clientes.
