import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { EsusThriftService } from './esus-thrift.service';
import { DataSource } from 'typeorm';
import { SyncBatchPayloadDto } from './sync.dto';

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
        findOne: jest.fn().mockResolvedValue({ id: 1, cns_profissional: '123', cnes_estabelecimento: '456' }),
        save: jest
          .fn()
          .mockImplementation((_entity, data) => ({ id: 'uuid-123', ...data })),
        create: jest.fn().mockImplementation((_entity, data) => data),
        merge: jest.fn().mockImplementation((_entity, orig, data) => ({ ...orig, ...data })),
        find: jest.fn().mockResolvedValue([]),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: mockQueryRunner.manager,
    };

    const mockEsusThriftService = {
      mapIndividualToCDS: jest.fn().mockResolvedValue({}),
      serializeBatchToThrift: jest.fn().mockResolvedValue(Buffer.from('')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: EsusThriftService,
          useValue: mockEsusThriftService,
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
    payload.households = [{ 
      id: 'house-id', 
      logradouro: 'Rua Principal', 
      numero: '123', 
      bairro: 'Centro',
      recusa_cadastro: false,
      situacao_moradia: HousingSituation.PROPRIO,
      localizacao: HouseholdLocation.URBANA,
      tipo_domicilio: HouseholdType.CASA,
      numero_moradores: 4,
      numero_comodos: 5,
      material_construcao: ConstructionMaterial.ALVENARIA_TIJOLO_COM_REVESTIMENTO,
      abastecimento_agua: WaterSupply.REDE_ENCANADA,
      agua_consumo: WaterTreatment.FILTRACAO,
      escoamento_banheiro: SewageDisposal.REDE_COLETORA,
      possui_animais: false 
    }];
    
    const result = await service.processBatchSync(payload, 1);

    expect(result.sucesso).toBe(true);
    expect(result.salvos.households).toContain('house-id');
  });

  it('should rollback and throw error on severe failure', async () => {
    mockQueryRunner.manager.findOne.mockRejectedValue(new Error('Critical DB error'));
    
    const payload = getBaseSyncPayload();
    
    await expect(service.processBatchSync(payload, 1)).rejects.toThrow('Falha abissal');
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
