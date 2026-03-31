import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class LoginService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usuario: string, senha: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(usuario);
    if (user && (await bcrypt.compare(senha, user.senha))) {
      const { senha: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  async login(usuario: string, senha: string) {
    const user = await this.validateUser(usuario, senha);
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = { usuario: user.usuario, id: user.id, role: user.role };
    return {
      id: user.id,
      usuario: user.usuario,
      role: user.role,
      access_token: this.jwtService.sign(payload),
    };
  }
}
