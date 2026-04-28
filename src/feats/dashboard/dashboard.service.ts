import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';
import { Household } from '../households/household.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

interface HealthResult {
  hypertension: string;
  diabetes: string;
  pregnant: string;
  bedridden: string;
  mentalHealth: string;
}

interface VulnerabilityResult {
  bedridden: string;
  illiterate: string;
  drugAddiction: string;
  unemployed: string;
  physicalDisability: string;
  mentalDisability: string;
  severeMalnutrition: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Individual)
    private readonly individualRepository: Repository<Individual>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
    @InjectRepository(IndividualHealth)
    private readonly healthRepository: Repository<IndividualHealth>,
    @InjectRepository(FamilyRiskStratification)
    private readonly riskStratRepository: Repository<FamilyRiskStratification>,
  ) {}

  private applyFilters<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    filters: DashboardFilterDto,
    alias: string,
    householdJoinPath?: string,
  ) {
    if (filters.startDate && filters.endDate) {
      query.andWhere(`${alias}.created_at BETWEEN :start AND :end`, {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    if (filters.bairro) {
      if (householdJoinPath) {
        query.innerJoin(householdJoinPath, 'household_filter');
        query.andWhere('household_filter.bairro = :bairro', {
          bairro: filters.bairro,
        });
      } else if (alias === 'household') {
        query.andWhere('household.bairro = :bairro', { bairro: filters.bairro });
      }
    }
    return query;
  }

  async getNeighborhoods() {
    const result = await this.householdRepository
      .createQueryBuilder('household')
      .select('DISTINCT household.bairro', 'bairro')
      .where('household.bairro IS NOT NULL')
      .orderBy('household.bairro', 'ASC')
      .getRawMany<{ bairro: string }>();

    return result.map((r) => r.bairro);
  }

  async getDashboardStats(filters: DashboardFilterDto) {
    const [counts, riskDist, health, vulnerability] = await Promise.all([
      this.getCounts(filters),
      this.getRiskDistribution(filters),
      this.getHealthIndicators(filters),
      this.getVulnerabilityStats(filters),
    ]);

    return {
      totalCitizens: counts.individuals,
      totalFamilies: counts.families,
      activeHouseholds: counts.households,
      visitEfficiency: 100, // Placeholder
      riskDistribution: riskDist,
      healthConditions: health,
      vulnerabilityFactors: vulnerability,
    };
  }

  private async getCounts(filters: DashboardFilterDto) {
    const indQuery = this.applyFilters(
      this.individualRepository.createQueryBuilder('individual'),
      filters,
      'individual',
      'individual.household',
    );
    const famQuery = this.applyFilters(
      this.familyRepository.createQueryBuilder('family'),
      filters,
      'family',
      'family.household',
    );
    const houseQuery = this.applyFilters(
      this.householdRepository.createQueryBuilder('household'),
      filters,
      'household',
    );

    const [individuals, families, households] = await Promise.all([
      indQuery.getCount(),
      famQuery.getCount(),
      houseQuery.getCount(),
    ]);

    return { individuals, families, households };
  }

  async getPriorityCitizens(filters: DashboardFilterDto) {
    const query = this.individualRepository.createQueryBuilder('individual');
    query.leftJoinAndSelect('individual.healthConditions', 'health');
    query.leftJoinAndSelect('individual.family', 'family');
    this.applyFilters(query, filters, 'individual', 'individual.household');

    query.andWhere(
      '(health.gestante = true OR health.acamado_domiciliado = true OR health.diabetes = true OR health.hipertensao_arterial = true)',
    );

    const citizens = await query.take(10).getMany();

    return citizens.map((c) => ({
      id: c.id,
      name: c.nome_completo,
      cns: c.cartao_sus || 'N/A',
      riskClass: c.family?.classificacao_risco || 'R0',
      lastVisit: c.created_at.toISOString(),
      conditions: [
        c.healthConditions?.gestante ? 'Gestante' : null,
        c.healthConditions?.acamado_domiciliado ? 'Acamado' : null,
        c.healthConditions?.diabetes ? 'Diabetes' : null,
        c.healthConditions?.hipertensao_arterial ? 'Hipertensão' : null,
      ].filter(Boolean),
    }));
  }

  async getRiskDistribution(filters: DashboardFilterDto) {
    const query = this.familyRepository.createQueryBuilder('family');
    this.applyFilters(query, filters, 'family', 'family.household');

    const result = await query
      .select('family.classificacao_risco', 'risk')
      .addSelect('COUNT(*)', 'count')
      .groupBy('family.classificacao_risco')
      .getRawMany<{ risk: string; count: string }>();

    const distribution = { R0: 0, R1: 0, R2: 0, R3: 0 };
    result.forEach((r) => {
      const key = (r.risk || 'R0').split(' ')[0] as keyof typeof distribution;
      if (distribution[key] !== undefined) {
        distribution[key] += parseInt(r.count, 10);
      }
    });

    return distribution;
  }

  async getHealthIndicators(filters: DashboardFilterDto) {
    const query = this.healthRepository.createQueryBuilder('health');
    query.innerJoin('health.individual', 'individual');
    this.applyFilters(query, filters, 'health', 'individual.household');

    const result = await query
      .select('SUM(CASE WHEN health.hipertensao_arterial THEN 1 ELSE 0 END)', 'hypertension')
      .addSelect('SUM(CASE WHEN health.diabetes THEN 1 ELSE 0 END)', 'diabetes')
      .addSelect('SUM(CASE WHEN health.gestante THEN 1 ELSE 0 END)', 'pregnant')
      .addSelect('SUM(CASE WHEN health.acamado_domiciliado THEN 1 ELSE 0 END)', 'bedridden')
      .addSelect('SUM(CASE WHEN health.doenca_mental THEN 1 ELSE 0 END)', 'mentalHealth')
      .getRawOne<HealthResult>();

    return {
      hypertension: parseInt(result?.hypertension || '0', 10),
      diabetes: parseInt(result?.diabetes || '0', 10),
      pregnant: parseInt(result?.pregnant || '0', 10),
      bedridden: parseInt(result?.bedridden || '0', 10),
      mentalIllness: parseInt(result?.mentalHealth || '0', 10),
      smoker: 0,
      alcoholUser: 0,
    };
  }

  async getVulnerabilityStats(filters: DashboardFilterDto) {
    const query = this.riskStratRepository.createQueryBuilder('risk');
    this.applyFilters(query, filters, 'risk', 'risk.family.household');

    const result = await query
      .select('SUM(risk.bedriddenCount)', 'bedridden')
      .addSelect('SUM(risk.illiterateCount)', 'illiterate')
      .addSelect('SUM(risk.drugAddictionCount)', 'drugAddiction')
      .addSelect('SUM(risk.unemployedCount)', 'unemployed')
      .addSelect('SUM(risk.physicalDisabilityCount)', 'physicalDisability')
      .addSelect('SUM(risk.mentalDisabilityCount)', 'mentalDisability')
      .addSelect('SUM(risk.severeMalnutritionCount)', 'severeMalnutrition')
      .getRawOne<VulnerabilityResult>();

    return {
      bedridden: parseInt(result?.bedridden || '0', 10),
      illiterate: parseInt(result?.illiterate || '0', 10),
      drugAddiction: parseInt(result?.drugAddiction || '0', 10),
      unemployed: parseInt(result?.unemployed || '0', 10),
      physicalDisability: parseInt(result?.physicalDisability || '0', 10),
      mentalDisability: parseInt(result?.mentalDisability || '0', 10),
      severeMalnutrition: parseInt(result?.severeMalnutrition || '0', 10),
    };
  }

  async getVulnerabilityRanking(filters: DashboardFilterDto) {
    const stats = await this.getVulnerabilityStats(filters);
    const ranking = [
      { label: 'Acamados', value: stats.bedridden },
      { label: 'Analfabetos', value: stats.illiterate },
      { label: 'Dependência Química', value: stats.drugAddiction },
      { label: 'Desempregados', value: stats.unemployed },
      { label: 'Deficiência Física', value: stats.physicalDisability },
      { label: 'Deficiência Mental', value: stats.mentalDisability },
      { label: 'Desnutrição Grave', value: stats.severeMalnutrition },
    ];

    return ranking.sort((a, b) => b.value - a.value);
  }

  async getEnvironmentalStats(filters: DashboardFilterDto) {
    const query = this.householdRepository.createQueryBuilder('household');
    this.applyFilters(query, filters, 'household');

    const result = await query
      .select('household.abastecimento_agua', 'water')
      .addSelect('household.destino_lixo', 'waste')
      .addSelect('SUM(CASE WHEN family.saneamento_inadequado THEN 1 ELSE 0 END)', 'inadequateSanitation')
      .leftJoin('household.families', 'family')
      .groupBy('household.abastecimento_agua')
      .addGroupBy('household.destino_lixo')
      .getRawMany<{ water: string; waste: string; inadequateSanitation: string }>();

    const totalSaneamento = result.reduce(
      (acc, curr) => acc + parseInt(curr.inadequateSanitation, 10),
      0,
    );

    const waterSupply: Record<string, number> = {};
    const wasteDestination: Record<string, number> = {};

    result.forEach((curr) => {
      waterSupply[curr.water] = (waterSupply[curr.water] || 0) + 1;
      wasteDestination[curr.waste] = (wasteDestination[curr.waste] || 0) + 1;
    });

    return {
      inadequateSanitation: totalSaneamento,
      waterSupply,
      wasteDestination,
    };
  }
}
