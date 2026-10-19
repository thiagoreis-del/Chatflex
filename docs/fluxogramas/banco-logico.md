# Relacionamentos lógicos — não schema físico

O banco real não foi fornecido. Este diagrama relaciona conceitos e campos consumidos pelo frontend; não afirma nome de tabela, foreign key, cardinalidade, RLS ou índice.

```mermaid
flowchart LR
    Empresa -->|planId| Plano
    Usuario -->|companyId e contexto| Empresa
    Usuario -->|queueIds| Fila
    Ticket -->|contato| Contato
    Ticket -->|userId| Usuario
    Ticket -->|queueId| Fila
    Ticket -->|conexão| WhatsApp
    Mensagem -->|ticketId| Ticket
    Mensagem -->|quotedMsg| MensagemCitada[Mensagem citada]
    ConversaInterna -->|membros| Usuario
    MensagemInterna --> ConversaInterna
    MensagemInterna -->|ticketId opcional| Ticket
    Fatura -->|companyId| Empresa
    Assinatura -->|companyId e plano| Empresa
    EventoAuditoria -->|ator e recurso| Usuario
```

Consultar [limites e evidências necessárias](../banco-de-dados.md). Não preencher um ERD físico fictício para suprir a ausência do backend.

---

[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
