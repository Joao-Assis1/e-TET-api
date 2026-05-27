import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';
import { Household } from '../households/household.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(10),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({}),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Individual),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Family),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Household),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(IndividualHealth),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(FamilyRiskStratification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return counts and stats for individuals, families and households', async () => {
      const result = await service.getDashboardStats({});
      expect(result).toEqual({
        totalCitizens: 10,
        totalFamilies: 10,
        activeHouseholds: 10,
        visitEfficiency: 100,
        riskDistribution: { R0: 0, R1: 0, R2: 0, R3: 0 },
        healthConditions: {
          hypertension: 0,
          diabetes: 0,
          pregnant: 0,
          bedridden: 0,
          mentalIllness: 0,
          smoker: 0,
          alcoholUser: 0,
        },
        vulnerabilityFactors: {
          bedridden: 0,
          illiterate: 0,
          drugAddiction: 0,
          unemployed: 0,
          physicalDisability: 0,
          mentalDisability: 0,
          severeMalnutrition: 0,
        },
      });
    });
  });
});
