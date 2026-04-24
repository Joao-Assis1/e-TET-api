import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginService } from './login.service';
import * as express from 'express';

@ApiTags('Autenticação')
@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @ApiOperation({ summary: 'Realizar login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cpf: { type: 'string', example: '12345678900' },
        senha: { type: 'string', example: 'acs123' },
      },
    },
  })
  async login(
    @Body('cpf') cpf: string,
    @Body('senha') senha: string,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const loginResult = await this.loginService.login(cpf, senha);

    // Configura o cookie HttpOnly
    response.cookie('access_token', loginResult.access_token, {
      httpOnly: true,
      secure: true, // Obrigatório para SameSite: 'none'
      sameSite: 'none', // Permite envio entre domínios diferentes (Vercel -> Render)
      maxAge: 1000 * 60 * 60 * 24, // 1 dia
    });

    // Retorna os dados do usuário sem o token (opcional, mas comum para UI)
    const { access_token, ...userData } = loginResult;
    return userData;
  }
}
