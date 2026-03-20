import { Controller, Post, Body } from '@nestjs/common';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  async login(@Body('usuario') usuario: string, @Body('senha') senha: string) {
    return this.loginService.login(usuario, senha);
  }
}
