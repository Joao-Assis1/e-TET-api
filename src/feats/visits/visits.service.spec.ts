import { Test, TestingModule } from '@nestjs/testing';
import { VisitsService } from './visits.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Visit } from './visit.entity';
import { Household } from '../households/household.entity';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';

describe('VisitsService', () => {
  let service: VisitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        {
          provide: getRepositoryToken(Visit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Household),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Individual),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Family),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VisitsService>(VisitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
