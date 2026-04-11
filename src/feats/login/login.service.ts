import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

/**
 * Serviço responsável por autenticar usuários e gerar tokens de acesso (JWT).
 */
@Injectable()
export class LoginService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida as credenciais do usuário comparando o hash da senha armazenado no banco.
   * @param usuario Nome de usuário informado.
   * @param senha Senha em texto puro informada.
   */
  async validateUser(usuario: string, senha: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(usuario);
    
    // Compara a senha informada com o hash salvo no banco
    if (user && (await bcrypt.compare(senha, user.senha))) {
      const { senha: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  /**
   * Realiza o login completo, gerando o token JWT caso as credenciais estejam corretas.
   */
  async login(usuario: string, senha: string) {
    const user = await this.validateUser(usuario, senha);
    
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload = { 
      usuario: user.usuario, 
      id: user.id, 
      role: user.role 
    };

    return {
      id: user.id,
      usuario: user.usuario,
      role: user.role,
      access_token: this.jwtService.sign(payload),
    };
  }
}
