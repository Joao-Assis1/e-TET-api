# 🧠 e-TET API: Motor Central de Dados

> ⚠️ **Documentação Centralizada (SSOT)**
>
> Em aderência às melhores práticas de engenharia de software, este repositório adota o princípio de **Single Source of Truth (Fonte Única de Verdade)**. 
> 
> Todos os manuais, decisões arquiteturais, guias e detalhes técnicos estão consolidados estruturalmente na pasta `docs/`.

## 📚 Índice de Documentação (`docs/`)

Explore nossa documentação profissional nas respectivas pastas:

- 📖 **[Onboarding & Handover](docs/handover/HANDOVER.md)**: Novo no time? Comece por aqui.
- 🏗️ **[Arquitetura e Decisões Técnicas](docs/architecture/)**: Relatórios, Roadmap de evolução e Sincronismo.
- 📡 **[Contratos de API](docs/api/)**: Documentação técnica de endpoints e Payloads.
- 🛡️ **[Padrões de Documentação e Guardrails](docs/guardrails/DOCUMENTATION_STANDARDS.md)**: Regras inegociáveis para aprovação de PRs.
- 🛠️ **[Guias (Guides)](docs/guides/)**: Guias de setup (Banco Local, Scripts de Seed) e troubleshooting.

## 🚀 Resumo do Projeto
O e-TET API é o **backend central** construído em **NestJS** que alimenta todo o ecossistema. Ele é responsável por processar a lógica de negócios, manter a segurança dos dados de saúde, expor os endpoints e consolidar as informações recebidas dos dispositivos móveis (e-ACS) e distribuí-las para o painel de gestão web (e-PET).
Utiliza Banco de Dados PostgreSQL provisionado via Neon.tech.
