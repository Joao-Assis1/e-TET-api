import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import {
  AnimalType,
  ConstructionMaterial,
  Household,
  HouseholdAccess,
  HouseholdLocation,
  HouseholdType,
  HousingSituation,
  SewageDisposal,
  TrashDestination,
  WaterSupply,
  WaterTreatment,
} from './household.entity';
import { User } from '../users/user.entity';

describe('HouseholdsService', () => {
  let service: HouseholdsService;

  const mockHouseholdRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: getRepositoryToken(Household),
          useValue: mockHouseholdRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<HouseholdsService>(HouseholdsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all households', async () => {
    const households = [{ id: 'uuid-1', logradouro: 'Rua A', numero: '10' }];
    mockHouseholdRepository.find.mockResolvedValue(households);

    const result = await service.findAll();

    expect(result).toEqual(households);
  });

  it('should return a household by id', async () => {
    const household = { id: 'uuid-1', logradouro: 'Rua A' };
    mockHouseholdRepository.findOne.mockResolvedValue(household);

    const result = await service.findOne('uuid-1');

    expect(result).toEqual(household);
  });

  it('should throw NotFoundException when household not found', async () => {
    mockHouseholdRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create a household', async () => {
    const dto = {
      logradouro: 'Rua B',
      numero: '20',
      bairro: 'Centro',
      situacao_moradia: HousingSituation.PROPRIO,
      localizacao: HouseholdLocation.URBANA,
      tipo_domicilio: HouseholdType.CASA,
      numero_moradores: 4,
      numero_comodos: 5,
      material_construcao: ConstructionMaterial.ALVENARIA_TIJOLO_COM_REVESTIMENTO,
      abastecimento_agua: WaterSupply.REDE_ENCANADA,
      agua_consumo: WaterTreatment.FILTRACAO,
      escoamento_banheiro: SewageDisposal.REDE_COLETORA,
      possui_animais: false,
    };
    mockHouseholdRepository.save.mockImplementation((h) =>
      Promise.resolve({
        id: 'new-uuid',
        ...h,
      }),
    );

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(mockHouseholdRepository.save).toHaveBeenCalled();
  });

  it('should update a household', async () => {
    const household = { id: 'uuid-1', logradouro: 'Rua A', numero: '10' };
    mockHouseholdRepository.findOne.mockResolvedValue(household);
    mockHouseholdRepository.save.mockImplementation((h) => h);

    const result = await service.update('uuid-1', { numero: '99' });

    expect(result.numero).toBe('99');
  });

  it('should soft remove a household', async () => {
    const household = { id: 'uuid-1', logradouro: 'Rua A' };
    mockHouseholdRepository.findOne.mockResolvedValue(household);
    mockHouseholdRepository.softRemove.mockResolvedValue(household);

    await service.remove('uuid-1');

    expect(mockHouseholdRepository.softRemove).toHaveBeenCalledWith(household);
  });
});
