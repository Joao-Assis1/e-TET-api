> ⚠️ **Novo Desenvolvedor?** [Leia o Guia de Handover (Transferência) aqui antes de começar!](docs/HANDOVER.md)

# ⚙️ e-TET: Motor de Risco e Integração de Saúde (API)

A **e-TET API** é o coração da Rede Neural do Cuidado. Trata-se de uma aplicação backend robusta que quebra o isolamento de dados na Atenção Primária à Saúde, conectando os dados vitais recolhidos presencialmente no domicílio (via e-ACS) aos médicos que atuarão na clínica (via e-PET).

## 🧠 Inteligência e Cálculo de Risco Automático
Sempre que um agente de saúde sincroniza as informações de uma nova visita domiciliar, a API atua como um motor de processamento, onde:
1. Valida de forma estrita a estrutura e as referências de Domicílios, Famílias e Cidadãos.
2. Calcula a pontuação em tempo real aplicando a **Metodologia de Risco Familiar de Coelho-Savassi** (atribuindo pesos matemáticos a condições como diabetes, gestação e infraestrutura sanitária).
3. Assina os dados com a trilha de auditoria completa e segura baseada na sessão do profissional autenticado.

## 🛡️ Características Arquiteturais
*   **RBAC Integrado (Perfis):** Sistema hierárquico seguro de acesso. Gestores têm privilégios completos, Médicos atuam como visualizadores focados na gestão clínica, e os ACS manipulam exclusivamente os dados restritos ao seu território demarcado (Microárea).
*   **Offline-First Sync:** Suporta geração de UUIDs híbrida (Client-Driven). Possui lógicas robustas de validação temporal (`clientUpdatedAt`) para solucionar conflitos de sincronizações atrasadas em áreas rurais.
*   **Persistence:** Arquitetura flexível com TypeORM capaz de rodar SQLite no desenvolvimento local e migrar para ambientes Serverless PostgreSQL (Neon DB) em produção.

## 🛠️ Tecnologias Principais
*   **Framework:** NestJS
*   **Linguagem:** TypeScript
*   **ORM / Banco:** TypeORM + PostgreSQL / SQLite3
*   **Segurança:** Implementação de Autenticação JWT Customizada, hashing bcrypt.

## 📦 Instalação e Execução

```bash
# 1. Instalar pacotes NPM
npm install

# 2. Configurar as credenciais e ambiente
cp .env.example .env

# 3. Levantar o backend (Live Reload - Dev)
npm run start:dev

# 4. Executar os Testes Unitários/E2E
npm run test
```

## 📚 Documentação do Projeto

Para mergulhar mais profundamente nas regras de negócio e modelagens complexas do domínio e-TET, navegue pelos documentos da pasta `docs/`:

- [Especificações Técnicas, Arquitetura e Regras de Negócio (Spec)](docs/spec.md)
- [Metodologia Clínica e Acadêmica do Projeto](docs/METODOLOGIA.md)
- [Roadmap de Funcionalidades Futuras](docs/ROADMAP.md)

> **Aviso à IA:** Todas as diretrizes arquiteturais e estritas de desenvolvimento deste projeto encontram-se nos arquivos globais de conhecimento [AGENTS.md](AGENTS.md) e [GEMINI.md](GEMINI.md). É obrigatória a leitura do AGENTS.md antes da criação de novos *Endpoints* ou *Services*.
