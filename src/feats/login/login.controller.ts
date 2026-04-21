import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginService } from './login.service';

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
  async login(@Body('cpf') cpf: string, @Body('senha') senha: string) {
    return this.loginService.login(cpf, senha);
  }
}
