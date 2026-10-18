# Autenticação

```mermaid
flowchart TD
    A[Entrar] --> B[POST auth/login com credenciais]
    B --> C{Sessão válida retornada?}
    C -- Não --> E[Exibir erro]
    C -- Sim --> D[Token em memória e perfil local]
    D --> F[app com ensureSession no navegador]
    F --> G[Consulta API autenticada]
    G --> H{Erro de sessão?}
    H -- Sim --> I[POST auth/refresh_token com cookie]
    I --> J{Renovou?}
    J -- Sim --> G
    J -- Não --> K[Limpar sessão e redirecionar]
    H -- Não --> M[Exibir resultado]
    D --> O[Logout]
    O --> K
```

A repetição após refresh é limitada; atributos do cookie dependem do servidor.

```mermaid
flowchart TD
    A[Superadmin autenticado] --> B[POST companies/id/enter]
    B --> C[Guardar sessão original somente em memória]
    C --> D[Usar sessão delegada retornada]
    D --> E[POST companies/exit]
    E --> F{Superadmin não delegado retornado?}
    F -- Sim --> G[Restaurar sessão e Socket]
    F -- Não --> H{Backup em memória disponível?}
    H -- Sim --> G
    H -- Não --> I[Erro: não inventar credencial]
```

Fallback local não comprova conclusão remota da saída.

---
[Voltar ao sumário](../README.md) · Documentação 1.0.0 · 18/10/2026
