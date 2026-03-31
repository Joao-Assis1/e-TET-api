import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IndividualsService } from './individuals.service';
import { Individual } from './individual.entity';
import { Family } from '../families/family.entity';

describe('IndividualsService', () => {
  let service: IndividualsService;

  const mockIndividualRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockFamilyRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndividualsService,
        {
          provide: getRepositoryToken(Individual),
          useValue: mockIndividualRepository,
        },
        { provide: getRepositoryToken(Family), useValue: mockFamilyRepository },
      ],
    }).compile();

    service = module.get<IndividualsService>(IndividualsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all individuals with family relation', async () => {
    const individuals = [{ id: 'uuid-1', nome_completo: 'João', family: {} }];
    mockIndividualRepository.find.mockResolvedValue(individuals);

    const result = await service.findAll();

    expect(result).toEqual(individuals);
    expect(mockIndividualRepository.find).toHaveBeenCalledWith({
      relations: ['family'],
    });
  });

  it('should return an individual by id', async () => {
    const individual = { id: 'uuid-1', nome_completo: 'João', family: {} };
    mockIndividualRepository.findOne.mockResolvedValue(individual);

    const result = await service.findOne('uuid-1');

    expect(result).toEqual(individual);
  });

  it('should throw NotFoundException when individual not found', async () => {
    mockIndividualRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when family does not exist on create', async () => {
    mockFamilyRepository.findOne.mockResolvedValue(null);

    const dto: any = {
      family_id: 'non-existent-family',
      nome_completo: 'Test',
      data_nascimento: '1990-01-01',
      sexo: 'Masculino',
      raca_cor: 'Branca',
      nacionalidade: 'Brasileira',
      possui_cartao_sus: false,
      possui_deficiencia: false,
      situacao_peso: 'Adequado',
      fumante: false,
      uso_alcool: false,
      uso_outras_drogas: false,
      hipertensao_arterial: false,
      diabetes: false,
      teve_avc_derrame: false,
      teve_infarto: false,
      doenca_cardiaca: false,
      problemas_rins: false,
      doenca_respiratoria: false,
      tuberculose: false,
      hanseniase: false,
      teve_cancer: false,
      doenca_mental_psiquiatrica: false,
      acamado: false,
      domiciliado: false,
      usa_plantas_medicinais: false,
    };

    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('should create individual when family exists', async () => {
    const family = { id: 'family-uuid', numero_prontuario: '001' };
    mockFamilyRepository.findOne.mockResolvedValue(family);
    mockIndividualRepository.save.mockImplementation((ind) =>
      Promise.resolve({
        id: 'new-uuid',
        ...ind,
      }),
    );

    const dto: any = {
      family_id: 'family-uuid',
      nome_completo: 'Maria Silva',
      data_nascimento: '1990-01-01',
      sexo: 'Feminino',
      raca_cor: 'Branca',
      nacionalidade: 'Brasileira',
      possui_cartao_sus: true,
      cartao_sus: '123456',
      possui_deficiencia: false,
      situacao_peso: 'Adequado',
      fumante: false,
      uso_alcool: false,
      uso_outras_drogas: false,
      hipertensao_arterial: false,
      diabetes: false,
      teve_avc_derrame: false,
      teve_infarto: false,
      doenca_cardiaca: false,
      problemas_rins: false,
      doenca_respiratoria: false,
      tuberculose: false,
      hanseniase: false,
      teve_cancer: false,
      doenca_mental_psiquiatrica: false,
      acamado: false,
      domiciliado: false,
      usa_plantas_medicinais: false,
    };

    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(mockIndividualRepository.save).toHaveBeenCalled();
  });

  it('should soft remove an individual', async () => {
    const individual = { id: 'uuid-1', nome_completo: 'João' };
    mockIndividualRepository.findOne.mockResolvedValue(individual);
    mockIndividualRepository.softRemove.mockResolvedValue(individual);

    await service.remove('uuid-1');

    expect(mockIndividualRepository.softRemove).toHaveBeenCalledWith(
      individual,
    );
  });
});
