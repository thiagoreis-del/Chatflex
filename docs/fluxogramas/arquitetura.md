# Arquitetura e integrações

```mermaid
flowchart LR
    U[Usuário no navegador] --> R[TanStack Router e React]
    R --> Q[TanStack Query]
    Q --> C[Cliente HTTP compartilhado]
    C --> API[API externa: autorização e negócio não inspecionados]
    R --> S[Socket.IO por empresa]
    S --> API
    R --> L[Rascunhos e outbox local de texto]
    R --> N[Som e notificações do navegador]
    R --> B[BrasilAPI CNPJ]
    API -. depende de implementação externa .-> DB[Banco e serviços não fornecidos]
    API -. contrato WhatsApp .-> W[Conexões e mensagens WhatsApp]
    V[TanStack Start SSR: páginas públicas] --> R
    CI[Workflow existente: push main] --> VPS[SSH e Nitro Node na VPS]
    VPS --> V
```

Nenhum fluxo remoto foi executado. Setas tracejadas são dependências externas, não comprovação de serviços instalados.

---

[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
