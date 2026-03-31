import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { Household } from './household.entity';

describe('HouseholdsService', () => {
  let service: HouseholdsService;

  const mockHouseholdRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: getRepositoryToken(Household),
          useValue: mockHouseholdRepository,
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
      situacao_moradia: 'Própria',
      localizacao: 'Urbana',
      tipo_domicilio: 'Casa',
      numero_moradores: 4,
      numero_comodos: 5,
      material_construcao: 'Alvenaria',
      abastecimento_agua: 'Rede pública',
      agua_consumo: 'Filtrada',
      escoamento_banheiro: 'Rede pública',
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
