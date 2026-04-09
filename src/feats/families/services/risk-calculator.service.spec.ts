import { Test, TestingModule } from '@nestjs/testing';
import { RiskCalculatorService } from './risk-calculator.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FamilyRiskStratification } from '../entities/family-risk.entity';
import { FamiliesService } from '../families.service';
import { BadRequestException } from '@nestjs/common';
import { FamilyRisk } from '../family.entity';

describe('RiskCalculatorService', () => {
  let service: RiskCalculatorService;
  let mockFamiliesService: any;
  let mockRiskRepository: any;

  beforeEach(async () => {
    mockFamiliesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'uuid-1', membros_declarados: 4 }),
    };

    mockRiskRepository = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskCalculatorService,
        {
          provide: getRepositoryToken(FamilyRiskStratification),
          useValue: mockRiskRepository,
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
      poorSanitation: false, // 0 points
      roomsCount: 4, // 4 members / 4 rooms = 1 => 1 point
    };

    const result = await service.calculateFeatureRisk('uuid-1', payload, 'user-xyz');
    
    // total 3 + 2 + 1 + 1 = 7 (R2)
    expect(result.finalScore).toBe(7);
    expect(result.riskClass).toBe(FamilyRisk.R2);
    expect(mockRiskRepository.save).toHaveBeenCalled();
  });

  it('should calculate ratio < 1 correctly (0 points)', async () => {
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
      poorSanitation: true, // 3 points
      roomsCount: 5, // 4 members / 5 rooms < 1 => 0 points
    };

    const result = await service.calculateFeatureRisk('uuid-1', payload, 'user-xyz');
    
    // total 3 + 0 = 3 (R1)
    expect(result.finalScore).toBe(3);
    expect(result.riskClass).toBe(FamilyRisk.R1);
  });

  it('should execute anti-fraud properly and block when total > members', async () => {
    const payload = {
      bedriddenCount: 2,
      physicalDisabilityCount: 2,
      mentalDisabilityCount: 0,
      severeMalnutritionCount: 1,
      drugAddictionCount: 0,
      unemployedCount: 0,
      illiterateCount: 0,
      under6MonthsCount: 0,
      over70YearsCount: 0,
      hypertensionCount: 0,
      diabetesCount: 0,
      poorSanitation: false,
      roomsCount: 4,
    };
    // Sum = 2+2+1 = 5. Members = 4.

    await expect(service.calculateFeatureRisk('uuid-1', payload, 'user-xyz')).rejects.toThrow(BadRequestException);
  });
});
