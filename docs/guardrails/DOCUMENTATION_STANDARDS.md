# Padrões de Documentação (Guardrails)

Este documento atua como um **Guardrail Passivo** para o projeto e-TET-api. Ele estabelece as fronteiras do que deve ser documentado e como mantermos o Princípio da Fonte Única de Verdade (Single Source of Truth - SSOT).

## 1. Single Source of Truth (SSOT)
A pasta `docs/` é o **único local** onde a documentação do projeto vive.
- **Não** adicione guias detalhados no `README.md`. O `README.md` serve exclusivamente como índice e direcionador para a pasta `docs/`.
- **Não** mantenha documentos técnicos espalhados pela raiz do projeto.

## 2. A Estrutura da Pasta `docs/`
- `docs/architecture/`: Documente aqui as decisões técnicas, esquemas de Banco de Dados (Neon Postgres) e fluxos complexos (ex: algoritmos de Sincronização Mobile).
- `docs/api/`: Documentação sobre contratos de endpoints, Swagger (se aplicável), payloads de request/response e versionamento de API.
- `docs/guides/`: Guias voltados para o desenvolvedor (como configurar o banco SQLite local ou usar os scripts de `seed.js`).
- `docs/guardrails/`: Este diretório (regras e limites estabelecidos).
- `docs/handover/`: O material para onboarding de um novo membro da equipe.

## 3. Information Drift (O que NÃO documentar)
- Evite explicar como configurar ferramentas básicas do NestJS. Direcione para a documentação oficial do NestJS. Documente apenas o que for uma escolha de design específica do nosso projeto.

## 4. O Checklist do Pull Request (Active Guardrail)
É **estritamente proibido** aprovar um Pull Request (PR) que altere contratos de API ou modelos de Banco de Dados sem a devida atualização do respectivo arquivo `.md` na pasta `docs/`. O `.github/PULL_REQUEST_TEMPLATE.md` fará essa verificação.
