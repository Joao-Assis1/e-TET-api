import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas gerais de indivíduos, famílias e domicílios' })
  async getGeneralStats(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getDashboardStats(filters);
  }

  @Get('neighborhoods')
  @ApiOperation({ summary: 'Lista de bairros cadastrados' })
  async getNeighborhoods() {
    return this.dashboardService.getNeighborhoods();
  }

  @Get('priority-citizens')
  @ApiOperation({ summary: 'Cidadãos com condições de saúde prioritárias' })
  async getPriorityCitizens(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getPriorityCitizens(filters);
  }

  @Get('risk-distribution')
  @ApiOperation({ summary: 'Distribuição de famílias por classificação de risco' })
  async getRiskDistribution(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getRiskDistribution(filters);
  }

  @Get('health-indicators')
  @ApiOperation({ summary: 'Indicadores de saúde (hipertensão, diabetes, etc)' })
  async getHealthIndicators(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getHealthIndicators(filters);
  }

  @Get('environmental-stats')
  @ApiOperation({ summary: 'Estatísticas ambientais e saneamento' })
  async getEnvironmentalStats(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getEnvironmentalStats(filters);
  }

  @Get('vulnerability-ranking')
  @ApiOperation({ summary: 'Ranking de vulnerabilidade detalhado (Coelho-Savassi)' })
  async getVulnerabilityRanking(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.getVulnerabilityRanking(filters);
  }
}
