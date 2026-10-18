# Operação dos módulos

```mermaid
flowchart TD
    A[Atendimento aguardando] --> B[Aceitar com usuário atual]
    B --> C[Ticket aberto]
    C --> D[Texto, mídia ou nota]
    D --> E{Rede e API disponíveis?}
    E -- Sim --> F[POST messages/ticketId]
    E -- Não e texto --> G[Outbox local]
    G --> H[Reenviar no ticket aberto ao recuperar conexão]
    H --> F
    C --> I[Transferir na fila atual]
    I --> J{Destinatário?}
    J -- Usuário --> C
    J -- Qualquer atendente --> A
    C --> K[Finalizar e agradecimento configurado]
    K --> L[Ticket fechado]
    C --> M[Recusar por admin]
    M --> L
    L --> N[Reabrir]
    N --> C
```

Recusa também oculta localmente; não é transferência. Anexos não vão à outbox.

```mermaid
flowchart LR
    C[Contatos: formulário ou CSV simples] --> CP[POST ou PUT contacts]
    Q[Filas: editar] --> QG[GET registro completo]
    QG --> QP[PUT whitelist preservando campos ocultos]
    R[Resposta rápida] --> RP[POST ou PUT quick-messages]
    RP --> T[Selecionar no compositor]
    W[Conexão e QR] --> WS[whatsapp e whatsappsession]
    ST[Até 20 imagens e legendas] --> SP[POST status/test-batch]
    IC[Chat interno] --> IP[Contrato internal-chat]
    CF[Horários e mensagens] --> CA[Escritas de empresa, settings e WhatsApp]
```

Sucesso de chamada não comprova publicação individual de Status ou execução de automação fora do expediente.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
