import { Test, TestingModule } from '@nestjs/testing';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { UsersService } from '../users/users.service';

describe('VisitsController', () => {
  let controller: VisitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitsController],
      providers: [
        {
          provide: VisitsService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<VisitsController>(VisitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
