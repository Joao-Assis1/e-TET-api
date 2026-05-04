import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas gerais de indivíduos, famílias e domicílios' })
  @ApiOkResponse({ description: 'Retorna estatísticas consolidadas' })
  async getGeneralStats(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getDashboardStats(filters);
  }

  @Get('neighborhoods')
  @ApiOperation({ summary: 'Lista de bairros cadastrados' })
  @ApiOkResponse({ description: 'Retorna a lista de nomes de bairros' })
  async getNeighborhoods() {
    return this.dashboardService.getNeighborhoods();
  }

  @Get('priority-citizens')
  @ApiOperation({ summary: 'Cidadãos com condições de saúde prioritárias' })
  @ApiOkResponse({ description: 'Retorna lista de cidadãos prioritários (máx 10)' })
  async getPriorityCitizens(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getPriorityCitizens(filters);
  }

  @Get('risk-distribution')
  @ApiOperation({ summary: 'Distribuição de famílias por classificação de risco' })
  @ApiOkResponse({ description: 'Retorna contagem de famílias por nível de risco (R0-R3)' })
  async getRiskDistribution(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getRiskDistribution(filters);
  }

  @Get('health-indicators')
  @ApiOperation({ summary: 'Indicadores de saúde (hipertensão, diabetes, etc)' })
  @ApiOkResponse({ description: 'Retorna contagem de condições de saúde específicas' })
  async getHealthIndicators(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getHealthIndicators(filters);
  }

  @Get('environmental-stats')
  @ApiOperation({ summary: 'Estatísticas ambientais e saneamento' })
  @ApiOkResponse({ description: 'Retorna dados sobre água, lixo e saneamento' })
  async getEnvironmentalStats(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getEnvironmentalStats(filters);
  }

  @Get('vulnerability-ranking')
  @ApiOperation({ summary: 'Ranking de vulnerabilidade detalhado (Coelho-Savassi)' })
  @ApiOkResponse({ description: 'Retorna ranking de fatores de vulnerabilidade ordenados' })
  async getVulnerabilityRanking(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getVulnerabilityRanking(filters);
  }
}
