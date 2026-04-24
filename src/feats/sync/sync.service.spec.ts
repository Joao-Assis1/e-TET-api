import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { RiskCalculatorService } from '../families/services/risk-calculator.service';
import { DataSource } from 'typeorm';
import { SyncBatchPayloadDto } from './sync.dto';
import {
  HousingSituation,
  HouseholdLocation,
  HouseholdType,
  ConstructionMaterial,
  WaterSupply,
  WaterTreatment,
  SewageDisposal,
} from '../households/household.entity';

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
        findOne: jest.fn().mockImplementation((entity, options) => {
          // If we want to simulate returning an existing record
          if (options && options.where && options.where.id === 'deleted-123') {
            return Promise.resolve({
              id: 'deleted-123',
              deletedAt: new Date(),
            });
          }
          if (entity.name === 'User') {
            return Promise.resolve({
              id: 1,
            });
          }
          if (options && options.where && options.where.id === 'exist') {
            return Promise.resolve({ id: 'exist' });
          }
          return Promise.resolve(null);
        }),
        save: jest.fn().mockImplementation((_entity, data) => ({
          id: data.id || 'uuid-123',
          ...data,
        })),
        create: jest.fn().mockImplementation((_entity, data) => data),
        merge: jest
          .fn()
          .mockImplementation((_entity, orig, data) => ({ ...orig, ...data })),
        find: jest.fn().mockResolvedValue([]),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: mockQueryRunner.manager,
    };

    const mockRiskCalculatorService = {
      calculateScoreAndClass: jest
        .fn()
        .mockReturnValue({ finalScore: 5, riskClass: 'R2' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RiskCalculatorService,
          useValue: mockRiskCalculatorService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  const getBaseSyncPayload = (): SyncBatchPayloadDto => ({
    households: [],
    families: [],
    individuals: [],
    visits: [],
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process empty batch sync', async () => {
    const payload = getBaseSyncPayload();
    const result = await service.processBatchSync(payload, 1);

    expect(result.sucesso).toBe(true);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('should process batch sync with household', async () => {
    const payload = getBaseSyncPayload();
    payload.households = [
      {
        id: 'b39e6a0d-debd-4a33-9118-2e3eb8c3f58a',
        logradouro: 'Rua Principal',
        numero: '123',
        bairro: 'Centro',
        recusa_cadastro: false,
        situacao_moradia: HousingSituation.PROPRIO,
        localizacao: HouseholdLocation.URBANA,
        tipo_domicilio: HouseholdType.CASA,
        numero_moradores: 4,
        numero_comodos: 5,
        material_construcao:
          ConstructionMaterial.ALVENARIA_TIJOLO_COM_REVESTIMENTO,
        abastecimento_agua: WaterSupply.REDE_ENCANADA,
        agua_consumo: WaterTreatment.FILTRACAO,
        escoamento_banheiro: SewageDisposal.REDE_COLETORA,
        energia_eletrica: true,
        destino_lixo: undefined,
        possui_animais: false,
      },
    ];

    const result = await service.processBatchSync(payload, 1);

    expect(result.sucesso).toBe(true);
    expect(result.households.map(h => h.id)).toContain(
      'b39e6a0d-debd-4a33-9118-2e3eb8c3f58a',
    );

    // Check if findOne uses { withDeleted: true }
    expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        where: { id: 'b39e6a0d-debd-4a33-9118-2e3eb8c3f58a' },
        withDeleted: true,
      }),
    );
  });

  it('should process sync with family and mock risk score properly', async () => {
    const payload = getBaseSyncPayload();
    payload.families = [
      {
        id: 'b39e6a0d-debd-4a33-9118-2e3eb8c3f58b',
        numero_prontuario: '12345',
        membros_declarados: 3,
        saneamento_inadequado: true,
      },
    ];

    const result = await service.processBatchSync(payload, 1);

    expect(result.sucesso).toBe(true);
    expect(result.families.map(f => f.id)).toContain(
      'b39e6a0d-debd-4a33-9118-2e3eb8c3f58b',
    );
  });

  it('should rollback and throw error on severe failure', async () => {
    mockQueryRunner.manager.findOne.mockRejectedValue(
      new Error('Critical DB error'),
    );

    const payload = getBaseSyncPayload();

    await expect(service.processBatchSync(payload, 1)).rejects.toThrow(
      'Falha crítica no processamento do lote de sincronização.',
    );
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
