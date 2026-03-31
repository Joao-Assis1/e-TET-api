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
      usuario: 'novo_user',
      senha: 'senha123',
    });

    expect(result.id).toBe(1);
    expect(result.usuario).toBe('novo_user');
    expect(result.senha).not.toBe('senha123');
  });

  it('should throw ConflictException if user already exists', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue({
      id: 1,
      usuario: 'existente',
    });

    await expect(
      service.create({ usuario: 'existente', senha: 'senha123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should return user by username', async () => {
    const user = { id: 1, usuario: 'admin', senha: 'hashed' };
    mockUsersRepository.findOneBy.mockResolvedValue(user);

    const result = await service.findByUsername('admin');

    expect(result).toEqual(user);
    expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({
      usuario: 'admin',
    });
  });

  it('should return null when user not found', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue(null);

    const result = await service.findByUsername('nonexistent');

    expect(result).toBeNull();
  });

  it('should verify a valid token', async () => {
    const payload = { id: 1, usuario: 'admin' };
    mockJwtService.verify.mockReturnValue(payload);

    const result = await service.verifyUserToken('valid-token');

    expect(result).toEqual(payload);
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.verifyUserToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
