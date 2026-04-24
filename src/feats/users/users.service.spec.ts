import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user with hashed password', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue(null);
    mockUsersRepository.save.mockImplementation((user) => {
      user.id = 1;
      return Promise.resolve(user);
    });

    const result = await service.create({
      cpf: '12345678900',
      senha: 'senha123',
    });

    expect(result.id).toBe(1);
    expect(result.cpf).toBe('12345678900');
    expect(result.senha).not.toBe('senha123');
  });

  it('should throw ConflictException if user already exists', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue({
      id: 1,
      cpf: '12345678900',
    });

    await expect(
      service.create({ cpf: '12345678900', senha: 'senha123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should return user by cpf', async () => {
    const user = { id: 1, cpf: '12345678900', senha: 'hashed' };
    mockUsersRepository.findOneBy.mockResolvedValue(user);

    const result = await service.findByCpf('12345678900');

    expect(result).toEqual(user);
    expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
      cpf: '12345678900',
    });
  });

  it('should return null when user not found', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue(null);

    const result = await service.findByCpf('00000000000');

    expect(result).toBeNull();
  });

  it('should verify a valid token', async () => {
    const payload = { id: 1, cpf: '12345678900' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const result = await service.verifyUserToken('valid-token');

    expect(result).toEqual(payload);
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    mockJwtService.verifyAsync.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.verifyUserToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
