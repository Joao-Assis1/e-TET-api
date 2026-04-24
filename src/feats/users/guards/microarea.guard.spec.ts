import { Test, TestingModule } from '@nestjs/testing';
import { MicroareaGuard } from './microarea.guard';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { REQUIRE_MICROAREA_MATCH_KEY } from '../decorators/microarea.decorator';

describe('MicroareaGuard', () => {
  let guard: MicroareaGuard;
  let mockReflector: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockReflector = {
      get: jest.fn(),
    };

    mockDataSource = {
      manager: {
        findOne: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicroareaGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    guard = module.get<MicroareaGuard>(MicroareaGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (user: any, params: any = {}): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
        }),
      }),
    } as any;
  };

  it('should allow if no entityType is requested', async () => {
    mockReflector.get.mockReturnValue(undefined);
    const context = createMockContext({ microarea: '01' });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow if user is ADMIN even without microarea', async () => {
    mockReflector.get.mockReturnValue('Household');
    const context = createMockContext(
      { role: 'admin', name: 'Admin without microarea' },
      { id: 'uuid-123' },
    );

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow if resource microarea matches user microarea', async () => {
    mockReflector.get.mockReturnValue('Household');
    mockDataSource.manager.findOne.mockResolvedValue({ microarea: '01' });
    const context = createMockContext({ microarea: '01' }, { id: 'uuid-123' });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow if resource has no microarea (e.g. unassigned)', async () => {
    mockReflector.get.mockReturnValue('Household');
    mockDataSource.manager.findOne.mockResolvedValue({ microarea: null });
    const context = createMockContext({ microarea: '01' }, { id: 'uuid-123' });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if resource microarea differs', async () => {
    mockReflector.get.mockReturnValue('Household');
    mockDataSource.manager.findOne.mockResolvedValue({ microarea: '02' });
    const context = createMockContext({ microarea: '01' }, { id: 'uuid-123' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
