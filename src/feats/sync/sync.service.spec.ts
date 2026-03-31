import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';

describe('SyncService', () => {
  let service: SyncService;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest
          .fn()
          .mockImplementation((_entity, data) => ({ id: 'uuid-123', ...data })),
        create: jest.fn().mockImplementation((_entity, data) => data),
        delete: jest.fn().mockResolvedValue({}),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  const getBaseSyncPayload = () => ({
    family: {
      numero_prontuario: '12345',
      renda_familiar: 1000,
      numero_membros: 1,
      reside_desde: '2023-01-01',
      saneamento_inadequado: false,
    },
    individuals: [] as any[],
  });

  const getBaseIndividual = () => ({
    possui_cartao_sus: false,
    nome_completo: 'João Silva',
    data_nascimento: '1990-01-01',
    sexo: 'Masculino' as any,
    raca_cor: 'Branca' as any,
    nacionalidade: 'Brasileira' as any,
    possui_deficiencia: false,
    situacao_peso: 'Adequado' as any,
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
    desempregado: false,
    analfabeto: false,
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate R1 (Risco menor) - Score between 5 and 6', async () => {
    const payload = getBaseSyncPayload();
    payload.individuals.push({
      ...getBaseIndividual(),
      desempregado: true,
      acamado: true,
    });

    const result = await service.syncFamilyData(payload as any);

    expect(result.pontuacao_risco).toBe(5);
    expect(result.classificacao_risco).toBe('R1 - Risco menor');
    expect(result.individualsCount).toBe(1);
  });

  it('should calculate R2 (Risco médio) - Score between 7 and 8', async () => {
    const payload = getBaseSyncPayload();
    payload.family.saneamento_inadequado = true;
    payload.individuals.push({
      ...getBaseIndividual(),
      analfabeto: true,
      acamado: true,
    });

    const result = await service.syncFamilyData(payload as any);

    expect(result.pontuacao_risco).toBe(7);
    expect(result.classificacao_risco).toBe('R2 - Risco médio');
  });

  it('should calculate R3 (Risco máximo) - Score 9 or higher', async () => {
    const payload = getBaseSyncPayload();
    payload.family.saneamento_inadequado = true;
    payload.individuals.push({
      ...getBaseIndividual(),
      acamado: true,
      possui_deficiencia: true,
    });

    const result = await service.syncFamilyData(payload as any);

    expect(result.pontuacao_risco).toBe(9);
    expect(result.classificacao_risco).toBe('R3 - Risco máximo');
  });

  it('should calculate Sem Risco - Score below 5', async () => {
    const payload = getBaseSyncPayload();
    payload.individuals.push({
      ...getBaseIndividual(),
      analfabeto: true,
      desempregado: true,
      hipertensao_arterial: true,
    });

    const result = await service.syncFamilyData(payload as any);

    expect(result.pontuacao_risco).toBe(4);
    expect(result.classificacao_risco).toBe('Sem Risco');
  });

  it('should commit the transaction on success', async () => {
    const payload = getBaseSyncPayload();

    const result = await service.syncFamilyData(payload as any);

    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
    expect(result.message).toContain('sucesso');
  });

  it('should rollback the transaction on error and release runner', async () => {
    mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

    const payload = getBaseSyncPayload();

    await expect(service.syncFamilyData(payload as any)).rejects.toThrow(
      'Falha ao sincronizar dados',
    );
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should throw ConflictException when disease count exceeds family members', async () => {
    const payload = getBaseSyncPayload();
    payload.family.numero_membros = 0;
    payload.individuals.push({
      ...getBaseIndividual(),
      hipertensao_arterial: true,
    });

    await expect(service.syncFamilyData(payload as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should update existing family instead of creating a new one', async () => {
    const existingFamily = {
      id: 'existing-uuid',
      numero_prontuario: '12345',
      renda_familiar: 500,
      numero_membros: 2,
    };
    mockQueryRunner.manager.findOne.mockResolvedValue(existingFamily);

    const payload = getBaseSyncPayload();

    await service.syncFamilyData(payload as any);

    expect(mockQueryRunner.manager.delete).toHaveBeenCalled();
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
  });
});
