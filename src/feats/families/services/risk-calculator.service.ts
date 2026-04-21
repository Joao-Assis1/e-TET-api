import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyRiskStratification } from '../entities/family-risk.entity';
import { Individual } from '../../individuals/individual.entity';
import { CreateRiskAssessmentDto } from '../dto/create-risk.dto';
import { FamiliesService } from '../families.service';
import { FamilyRisk } from '../family.entity';

@Injectable()
export class RiskCalculatorService {
  constructor(
    @InjectRepository(FamilyRiskStratification)
    private readonly riskRepository: Repository<FamilyRiskStratification>,
    @InjectRepository(Individual)
    private readonly individualRepository: Repository<Individual>,
    private readonly familiesService: FamiliesService,
  ) {}

  public calculateScoreAndClass(
    payload: CreateRiskAssessmentDto,
    individualsCount: number,
  ): { finalScore: number; riskClass: string } {
    if (individualsCount <= 0) {
      throw new BadRequestException(
        'Não há indivíduos ativos vinculados para realizar a estratificação.',
      );
    }

    // Anti-Fraud validation: No single sentinel count can exceed the population
    const maxSingleSentinel = Math.max(
      payload.bedriddenCount || 0,
      payload.physicalDisabilityCount || 0,
      payload.mentalDisabilityCount || 0,
      payload.severeMalnutritionCount || 0,
      payload.drugAddictionCount || 0,
      payload.unemployedCount || 0,
      payload.illiterateCount || 0,
      payload.under6MonthsCount || 0,
      payload.over70YearsCount || 0,
      payload.hypertensionCount || 0,
      payload.diabetesCount || 0,
    );

    if (maxSingleSentinel > individualsCount) {
      throw new BadRequestException(
        'Uma ou mais sentinelas excederam a população de indivíduos vinculados.',
      );
    }

    if (!payload.roomsCount || payload.roomsCount <= 0) {
      throw new BadRequestException('roomsCount must be > 0');
    }

    // Weight *3
    const weight3 =
      (payload.bedriddenCount || 0) * 3 +
      (payload.physicalDisabilityCount || 0) * 3 +
      (payload.mentalDisabilityCount || 0) * 3 +
      (payload.severeMalnutritionCount || 0) * 3;

    // Weight *2
    const weight2 =
      (payload.drugAddictionCount || 0) * 2 +
      (payload.unemployedCount || 0) * 2 +
      (payload.illiterateCount || 0) * 2 +
      (payload.under6MonthsCount || 0) * 2 +
      (payload.over70YearsCount || 0) * 2;

    // Weight *1
    const weight1 =
      (payload.hypertensionCount || 0) * 1 +
      (payload.diabetesCount || 0) * 1 +
      (!payload.basicSanitation ? 3 : 0);

    // Room ratio
    const ratio = individualsCount / payload.roomsCount;
    let ratioPoints = 0;
    if (ratio < 1) {
      ratioPoints = 0;
    } else if (ratio === 1) {
      ratioPoints = 1;
    } else {
      ratioPoints = 2; // ratio > 1
    }

    const finalScore = weight3 + weight2 + weight1 + ratioPoints;

    let riskClass: string = FamilyRisk.R0;
    if (finalScore >= 9) {
      riskClass = FamilyRisk.R3;
    } else if (finalScore >= 7) {
      riskClass = FamilyRisk.R2;
    } else if (finalScore >= 5) {
      riskClass = FamilyRisk.R1;
    }

    return { finalScore, riskClass };
  }

  async calculateFeatureRisk(
    familyId: string,
    payload: CreateRiskAssessmentDto,
    userId: string,
  ): Promise<FamilyRiskStratification> {
    const family = await this.familiesService.findOne(familyId).catch((err) => {
      console.error(
        `[RiskCalculatorService] Família ${familyId} não encontrada:`,
        err.message,
      );
      throw new NotFoundException(
        `Família [${familyId}] não localizada no sistema`,
      );
    });

    const individualsCount = await this.individualRepository.count({
      where: { family_id: familyId, arquivado: false },
    });

    const { finalScore, riskClass } = this.calculateScoreAndClass(
      payload,
      individualsCount,
    );

    const riskRecord = new FamilyRiskStratification();
    riskRecord.family = family;
    riskRecord.familyId = family.id;
    riskRecord.bedriddenCount = payload.bedriddenCount;
    riskRecord.physicalDisabilityCount = payload.physicalDisabilityCount;
    riskRecord.mentalDisabilityCount = payload.mentalDisabilityCount;
    riskRecord.severeMalnutritionCount = payload.severeMalnutritionCount;
    riskRecord.drugAddictionCount = payload.drugAddictionCount;
    riskRecord.unemployedCount = payload.unemployedCount;
    riskRecord.illiterateCount = payload.illiterateCount;
    riskRecord.under6MonthsCount = payload.under6MonthsCount;
    riskRecord.over70YearsCount = payload.over70YearsCount;
    riskRecord.hypertensionCount = payload.hypertensionCount;
    riskRecord.diabetesCount = payload.diabetesCount;
    riskRecord.basicSanitation = payload.basicSanitation;
    riskRecord.roomsCount = payload.roomsCount;
    riskRecord.finalScore = finalScore;
    riskRecord.riskClass = riskClass;
    riskRecord.createdBy = userId;

    try {
      console.log(
        '[RiskCalculatorService] Salvando registro de risco para família:',
        familyId,
      );
      const saved = await this.riskRepository.save(riskRecord);

      // Atualizar também o status na entidade Family para manter compatibilidade
      await this.familiesService.update(familyId, {
        pontuacao_risco: finalScore,
        classificacao_risco: riskClass as any,
      });

      return saved;
    } catch (error) {
      console.error(
        '[RiskCalculatorService] ERRO CRÍTICO AO SALVAR RISCO:',
        error,
      );
      throw new InternalServerErrorException(
        `Erro ao persistir estratificação: ${error.message}`,
      );
    }
  }

  /**
   * Retorna o histórico de estratificações de risco de uma família.
   * Ordenado do mais recente para o mais antigo.
   */
  async getRiskHistory(familyId: string): Promise<FamilyRiskStratification[]> {
    return this.riskRepository.find({
      where: { familyId },
      order: { createdAt: 'DESC' },
    });
  }
}
