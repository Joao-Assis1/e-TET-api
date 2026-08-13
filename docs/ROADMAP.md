# Roadmap: e-TET-api

Este roadmap contém as melhorias técnicas planejadas para o back-end e banco de dados do sistema e-TET.
Essas tarefas também estão registradas como *Issues* no GitHub para acompanhamento e desenvolvimento futuro.

## 1. Validação Estrita (class-validator)
- **Descrição:** Habilitar globalmente o `ValidationPipe` com `{ whitelist: true, forbidNonWhitelisted: true }`.
- **Objetivo:** Bloquear silenciosamente qualquer tentativa de injeção de parâmetros não mapeados nos DTOs (Data Transfer Objects), protegendo o banco de dados contra *mass assignment*.

## 2. Autenticação Robusta (Refresh Tokens)
- **Descrição:** Migrar o `AuthGuard` customizado atual para os pacotes oficiais `@nestjs/jwt` e `@nestjs/passport`.
- **Objetivo:** Suportar *Refresh Tokens*, impedindo que a sessão do usuário deslogue repentinamente durante uma visita de saúde quando o token JWT de vida curta expirar.

## 3. Versionamento de Banco de Dados (TypeORM Migrations)
- **Descrição:** Desativar a flag `synchronize: true` no ambiente de produção e implementar rotinas oficiais de *Migrations*.
- **Objetivo:** Controlar rigorosamente as evoluções do esquema do banco de dados (NeonDB/Postgres), permitindo deploy seguro e possibilitando rollbacks sem risco de perda de dados populacionais.
