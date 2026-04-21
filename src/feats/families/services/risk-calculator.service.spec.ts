import { Test, TestingModule } from '@nestjs/testing';
import { RiskCalculatorService } from './risk-calculator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FamilyRiskStratification } from '../entities/family-risk.entity';
import { Individual } from '../../individuals/individual.entity';
import { FamiliesService } from '../families.service';
import { BadRequestException } from '@nestjs/common';
import { FamilyRisk } from '../family.entity';

describe('RiskCalculatorService', () => {
  let service: RiskCalculatorService;
  let mockFamiliesService: any;
  let mockRiskRepository: any;
  let mockIndividualRepository: any;

  beforeEach(async () => {
    mockFamiliesService = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-1', membros_declarados: 4 }),
      update: jest.fn().mockResolvedValue(true),
    };

    mockRiskRepository = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockIndividualRepository = {
      count: jest.fn().mockResolvedValue(4),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskCalculatorService,
        {
          provide: getRepositoryToken(FamilyRiskStratification),
          useValue: mockRiskRepository,
        },
        {
          provide: getRepositoryToken(Individual),
          useValue: mockIndividualRepository,
        },
        {
          provide: FamiliesService,
          useValue: mockFamiliesService,
        },
      ],
    }).compile();

    service = module.get<RiskCalculatorService>(RiskCalculatorService);
  });

  it('should calculate math correctly and save', async () => {
    const payload = {
      bedriddenCount: 1, // 3 points
      physicalDisabilityCount: 0,
      mentalDisabilityCount: 0,
      severeMalnutritionCount: 0,
      drugAddictionCount: 1, // 2 points
      unemployedCount: 0,
      illiterateCount: 0,
      under6MonthsCount: 0,
      over70YearsCount: 0,
      hypertensionCount: 1, // 1 point
      diabetesCount: 0,
      basicSanitation: true, // 0 points
      roomsCount: 4, // 4 individuals / 4 rooms = 1 => 1 point
    };

    const result = await service.calculateFeatureRisk(
      'uuid-1',
      payload,
      'user-xyz',
    );

    // total 3 + 2 + 1 + 1 = 7 (R2)
    expect(result.finalScore).toBe(7);
    expect(result.riskClass).toBe(FamilyRisk.R2);
    expect(mockRiskRepository.save).toHaveBeenCalled();
  });

  it('should allow multiple sentinels for the same person', async () => {
    mockIndividualRepository.count.mockResolvedValue(1); // Only 1 person
    const payload = {
      bedriddenCount: 1, // 3 pts
      physicalDisabilityCount: 0,
      mentalDisabilityCount: 0,
      severeMalnutritionCount: 0,
      drugAddictionCount: 0,
      unemployedCount: 0,
      illiterateCount: 0,
      under6MonthsCount: 0,
      over70YearsCount: 0,
      hypertensionCount: 1, // 1 pt
      diabetesCount: 1, // 1 pt
      basicSanitation: true,
      roomsCount: 1, // 1 individual / 1 room = 1 => 1 pt
    };

    const result = await service.calculateFeatureRisk(
      'uuid-1',
      payload,
      'user-xyz',
    );

    // total 3 + 1 + 1 + 1 = 6 (R1)
    expect(result.finalScore).toBe(6);
    expect(result.riskClass).toBe(FamilyRisk.R1);
  });

  it('should calculate ratio < 1 correctly (0 points)', async () => {
    mockIndividualRepository.count.mockResolvedValue(4);
    const payload = {
      bedriddenCount: 0,
      physicalDisabilityCount: 0,
      mentalDisabilityCount: 0,
      severeMalnutritionCount: 0,
      drugAddictionCount: 0,
      unemployedCount: 0,
      illiterateCount: 0,
      under6MonthsCount: 0,
      over70YearsCount: 0,
      hypertensionCount: 0,
      diabetesCount: 0,
      basicSanitation: false, // 3 points
      roomsCount: 5, // 4 individuals / 5 rooms < 1 => 0 points
    };

    const result = await service.calculateFeatureRisk(
      'uuid-1',
      payload,
      'user-xyz',
    );

    // total 3 + 0 = 3 (R0)
    expect(result.finalScore).toBe(3);
    expect(result.riskClass).toBe(FamilyRisk.R0);
  });

  it('should block if individualsCount is 0', async () => {
    mockIndividualRepository.count.mockResolvedValue(0);
    const payload = {
      bedriddenCount: 0,
      roomsCount: 4,
    } as any;

    await expect(
      service.calculateFeatureRisk('uuid-1', payload, 'user-xyz'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should block if any single sentinel count > individualsCount', async () => {
    mockIndividualRepository.count.mockResolvedValue(2);
    const payload = {
      bedriddenCount: 3, // Exceeds 2
      roomsCount: 4,
    } as any;

    await expect(
      service.calculateFeatureRisk('uuid-1', payload, 'user-xyz'),
    ).rejects.toThrow(BadRequestException);
  });
});
