import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginService } from './login.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('LoginService', () => {
  let service: LoginService;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return access_token when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    mockUsersService.findByUsername.mockResolvedValue({
      id: 1,
      usuario: 'admin',
      senha: hashedPassword,
    });

    const result = await service.login('admin', 'admin123');

    expect(mockJwtService.sign).toHaveBeenCalledWith({
      usuario: 'admin',
      id: 1,
    });
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    mockUsersService.findByUsername.mockResolvedValue(null);

    await expect(service.login('nonexistent', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10);

    mockUsersService.findByUsername.mockResolvedValue({
      id: 1,
      usuario: 'admin',
      senha: hashedPassword,
    });

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
