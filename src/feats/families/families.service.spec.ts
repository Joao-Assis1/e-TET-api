import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FamiliesService } from './families.service';
import {
  Family,
  FamilyIncome,
  FamilyRisk,
  FamilyStatus,
} from './family.entity';
import { DataSource } from 'typeorm';

describe('FamiliesService', () => {
  let service: FamiliesService;

  const mockFamilyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: getRepositoryToken(Family), useValue: mockFamilyRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FamiliesService>(FamiliesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all families', async () => {
    const families = [{ id: 'uuid-1', numero_prontuario: '001' }];
    mockFamilyRepository.find.mockResolvedValue(families);

    const result = await service.findAll();

    expect(result).toEqual(families);
    expect(mockFamilyRepository.find).toHaveBeenCalled();
  });

  it('should return a family by id', async () => {
    const family = { id: 'uuid-1', numero_prontuario: '001' };
    mockFamilyRepository.findOne.mockResolvedValue(family);

    const result = await service.findOne('uuid-1');

    expect(result).toEqual(family);
  });

  it('should throw NotFoundException when family not found', async () => {
    mockFamilyRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create a family', async () => {
    const dto = {
      numero_prontuario: '001',
      renda_familiar: FamilyIncome.DE_1_A_2_SM,
      membros_declarados: 3,
      reside_desde: '01/2023',
      household_id: 'household-uuid',
      status_mudanca: FamilyStatus.RESIDENTE,
      classificacao_risco: FamilyRisk.R1,
    };
    mockFamilyRepository.save.mockImplementation((family) =>
      Promise.resolve({
        id: 'new-uuid',
        ...family,
      }),
    );

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(mockFamilyRepository.save).toHaveBeenCalled();
  });

  it('should soft remove a family', async () => {
    const family = { id: 'uuid-1', numero_prontuario: '001' };
    mockFamilyRepository.findOne.mockResolvedValue(family);
    mockFamilyRepository.softRemove.mockResolvedValue(family);

    await service.remove('uuid-1');

    expect(mockFamilyRepository.softRemove).toHaveBeenCalledWith(family);
  });
});
