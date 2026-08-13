# 🤝 Guia do Desenvolvedor (Handover) - e-TET-api

Bem-vindo ao backend principal do ecossistema e-TET! Este guia descreve o que já está desenvolvido no coração da aplicação.

## 1. O que já está implementado?
A arquitetura modular (`src/feats/`) do NestJS já contempla as principais entidades do negócio de Saúde Primária:
- **`users` & `login`:** Sistema de autenticação (JWT/Bcrypt) completo. Acesso a rotas protegido pelos *Guards* de RBAC (Role-Based Access Control).
- **`households`, `families`, `individuals`:** Rotas de CRUD base de todo o território, implementadas seguindo as lógicas de *Soft Delete* (`deletedAt`) e relacionamentos de integridade com o TypeORM.
- **`visits`:** Estrutura para gravação do histórico de interações (ACS em campo).
- **`sync`:** O módulo mais crítico. Gerencia e resolve colisões dos *payloads* que chegam do aplicativo móvel (Offline), valendo-se do `updatedAt`.
- **Motor de Risco (Coelho-Savassi):** A lógica que processa os determinantes quantitativos de saúde já se encontra nos Services, injetando as classificações em tempo real.

## 2. Padrões de Código e Arquitetura
- **Banco de Dados:** Utiliza TypeORM. O banco de dados é SQLite no desenvolvimento local (`database.sqlite`) e PostgreSQL no ambiente Neon (Produção).
- **Auditoria e Segurança:** Todos os `POST` e `PUT` injetam `createdBy` e o ID da Microárea. Um ACS só consegue ler, editar e retornar dados pertencentes ao seu próprio bairro/microárea (`req.user.microareaId`).
- **Sincronização Offline-First:** O backend acata UUIDs vindos direto do payload para não quebrar referências geradas na rua.

## 3. Débitos Técnicos e Próximos Passos
1. **Workers e Cronjobs:** Implementar rotinas assíncronas/batch (usando filas como BullMQ/Redis) para gerar os enormes arquivos exportáveis (THRIFT/XML) do Ministério da Saúde. O fluxo de Request-Response da API de sincronização jamais pode ficar bloqueado esperando arquivos pesados serem gerados.
2. **Rotinas de Limpeza (Cleanup):** Criar *jobs* para arquivar *Soft Deletes* antigos que poluem os índices do Neon Postgres em produção.
