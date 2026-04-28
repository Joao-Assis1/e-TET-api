# 🚀 Prompts de Implementação: Backend (e-TET API)

Estes prompts foram desenhados para que você possa utilizá-los em ferramentas de IA (como Cursor, ChatGPT ou Claude) para implementar a lógica de dados do dashboard na sua API NestJS.

---

### Prompt 1: Criação do Módulo de Dashboard
> "Atue como um desenvolvedor NestJS sênior. Crie um novo módulo chamado `Dashboard` na e-TET API.
> 
> 1. **DashboardService**: Implemente métodos para extrair métricas consolidadas:
>    - `getGeneralStats()`: Contagem total de `Individual`, `Family` e `Household`.
>    - `getRiskDistribution()`: Agrupamento de famílias por `classificacao_risco` (R0, R1, R2, R3) usando a entidade `Family`.
>    - `getHealthIndicators()`: Contagem de indivíduos com `hipertensao_arterial`, `diabetes`, `gestante`, `acamado_domiciliado` e `doenca_mental` baseados na entidade `IndividualHealth`.
>    - `getEnvironmentalStats()`: Estatísticas de `abastecimento_agua`, `destino_lixo` e `saneamento_inadequado` da entidade `Household` e `Family`.
> 
> 2. **DashboardController**: Crie endpoints GET para cada um desses métodos.
> 
> 3. **Filtros**: Todos os métodos devem aceitar filtros opcionais por `startDate`, `endDate` (baseados em `created_at`) e `bairro` (da entidade `Household`).
> 
> **Importante**: Não inclua nenhuma lógica de filtro por microárea ou por usuário/profissional. Use o TypeORM para as queries."

---

### Prompt 2: Query de Risco Coelho-Savassi Detalhada
> "No `DashboardService`, crie um método `getVulnerabilityRanking()`. Este método deve realizar uma agregação na entidade `FamilyRiskStratification` para somar as ocorrências de fatores específicos em todo o território, como:
> - `bedriddenCount` (Acamados)
> - `illiterateCount` (Analfabetos)
> - `drugAddictionCount` (Dependência Química)
> - `unemployedCount` (Desemprego)
> 
> Retorne um array de objetos ordenado pela maior frequência para alimentar um gráfico de barras. Considere os filtros globais de data e bairro."
