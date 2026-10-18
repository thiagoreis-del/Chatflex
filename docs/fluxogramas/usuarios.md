# Cadastro e gestão de usuários

```mermaid
flowchart TD
    A[Admin abre Usuários] --> B[Novo usuário]
    B --> C[Nome, email, perfil, filas e senha]
    C --> D{Validação local válida?}
    D -- Não --> C
    D -- Sim --> E[POST users]
    E --> F{API aceitou?}
    F -- Não --> G[Mensagem de erro]
    F -- Sim --> H[Atualizar lista]
    H --> I[Copiar ou compartilhar acesso por ação explícita]
    A --> J[Editar ou redefinir senha]
    J --> K[PUT users/id]
    A --> L[Confirmar bloqueio ou exclusão]
    L --> M[PUT blocked ou DELETE users/id]
```

Bloqueio/revogação e isolamento são responsabilidades backend não comprovadas. Perfil supervisor não é role interna independente. Senhas reais nunca integram este documento.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
