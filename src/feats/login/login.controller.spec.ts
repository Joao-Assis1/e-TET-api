import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

describe('LoginController', () => {
  let controller: LoginController;
  let loginService: LoginService;

  const mockLoginService = {
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [{ provide: LoginService, useValue: mockLoginService }],
    }).compile();

    controller = module.get<LoginController>(LoginController);
    loginService = module.get<LoginService>(LoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call loginService.login with correct params', async () => {
    const mockResponse = {
      id: 1,
      usuario: 'admin',
      role: 'admin',
      access_token: 'jwt-token',
    };
    mockLoginService.login.mockResolvedValue(mockResponse);

    const mockRes = {
      cookie: jest.fn(),
    } as any;

    const result = await controller.login('admin', 'admin123', mockRes);

    expect(loginService.login).toHaveBeenCalledWith('admin', 'admin123');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'access_token',
      'jwt-token',
      expect.any(Object),
    );
    expect(result).toEqual(mockResponse);
  });

  it('should propagate UnauthorizedException from service', async () => {
    mockLoginService.login.mockRejectedValue(
      new UnauthorizedException('Usuário ou senha inválidos'),
    );

    const mockRes = {
      cookie: jest.fn(),
    } as any;

    await expect(controller.login('wrong', 'wrong', mockRes)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
