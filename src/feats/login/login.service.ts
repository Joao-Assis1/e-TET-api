import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class LoginService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usuario: string, senha: string): Promise<any> {
    const user = await this.usersService.findByUsername(usuario);
    if (user && (await bcrypt.compare(senha, user.senha))) {
      const { senha, ...result } = user;
      return result;
    }
    return null;
  }

  async login(usuario: string, senha: string) {
    const user = await this.validateUser(usuario, senha);
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = { usuario: user.usuario, id: user.id };
    return {
      id: user.id,
      usuario: user.usuario,
      access_token: this.jwtService.sign(payload),
    };
  }
}
