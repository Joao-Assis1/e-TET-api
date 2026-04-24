import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginService } from './login.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('LoginService', () => {
  let service: LoginService;

  const mockUsersService = {
    findByCpf: jest.fn(),
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

    mockUsersService.findByCpf.mockResolvedValue({
      id: 1,
      cpf: '12345678900',
      senha: hashedPassword,
      role: 'acs',
      microarea: '01',
    });

    const result = await service.login('12345678900', 'admin123');

    expect(mockJwtService.sign).toHaveBeenCalledWith({
      cpf: '12345678900',
      id: 1,
      role: 'acs',
      microarea: '01',
    });
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    mockUsersService.findByCpf.mockResolvedValue(null);

    await expect(service.login('nonexistent', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10);

    mockUsersService.findByCpf.mockResolvedValue({
      id: 1,
      cpf: '12345678900',
      senha: hashedPassword,
    });

    await expect(service.login('12345678900', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
