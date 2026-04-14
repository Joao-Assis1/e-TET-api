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
        usuario: { type: 'string', example: 'acs_jose' },
        senha: { type: 'string', example: 'acs123' },
      },
    },
  })
  async login(@Body('usuario') usuario: string, @Body('senha') senha: string) {
    return this.loginService.login(usuario, senha);
  }
}
