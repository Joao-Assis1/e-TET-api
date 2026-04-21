import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { DataSource } from 'typeorm';
import { RiskCalculatorService } from '../families/services/risk-calculator.service';
import { User } from '../users/user.entity';
import { Household } from '../households/household.entity';
import { Family } from '../families/family.entity';
import { Individual } from '../individuals/individual.entity';

describe('SyncService (Integration)', () => {
  let service: SyncService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: RiskCalculatorService,
          useValue: { calculateScoreAndClass: () => ({ finalScore: 0, riskClass: 'Sem Risco' }) },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: () => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn((entity) => {
                  if (entity === User) return Promise.resolve({ id: 1, cpf: '12345678900' });
                  return Promise.resolve(null);
                }),
                create: jest.fn((entity, data) => ({ ...data })),
                merge: jest.fn((entity, target, data) => Object.assign(target, data)),
                save: jest.fn((entity, data) => Promise.resolve(data)),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('deve processar um lote de sincronização com novos UUIDs sem erros', async () => {
    const payload = {
      households: [{ 
        id: '1fe3b6f4-a43e-43d0-983f-d8b5393cd92b', 
        logradouro: 'Rua Teste', 
        numero: '10', 
        bairro: 'Centro',
        situacao_moradia: 'Próprio',
        localizacao: 'Urbana',
        tipo_domicilio: 'Casa',
        numero_moradores: 1,
        numero_comodos: 1,
        material_construcao: 'Alvenaria/Tijolo com revestimento',
        abastecimento_agua: 'Rede encanada até o domicílio',
        agua_consumo: 'Filtração',
        escoamento_banheiro: 'Rede coletora de esgoto ou pluvial',
        possui_animais: false
      }],
      families: [{ 
        id: '2678ecaa-516c-4ec0-b9df-205457a6a1c3', 
        household_id: '1fe3b6f4-a43e-43d0-983f-d8b5393cd92b', 
        numero_prontuario: 'PR-TDD' 
      }],
      individuals: [{ 
        id: 'bd1737dd-ecfb-421e-99d4-09c2bbe0efa6', 
        family_id: '2678ecaa-516c-4ec0-b9df-205457a6a1c3', 
        nome_completo: 'Cidadao TDD',
        data_nascimento: '1990-01-01',
        sexo: 'Masculino',
        raca_cor: 'Parda',
        nacionalidade: 'Brasileira',
        healthConditions: { gestante: false }
      }],
      visits: []
    };

    const result = await service.processBatchSync(payload as any, 1);
    
    expect(result.sucesso).toBe(true);
    expect(result.households).toHaveLength(1);
    expect(result.individuals).toHaveLength(1);
  });
});
