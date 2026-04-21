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
   * @param cpf CPF informado.
   * @param senha Senha em texto puro informada.
   */
  async validateUser(cpf: string, senha: string): Promise<User | null> {
    const user = await this.usersService.findByCpf(cpf);

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
  async login(cpf: string, senha: string) {
    const user = await this.validateUser(cpf, senha);

    if (!user) {
      throw new UnauthorizedException('CPF ou senha inválidos');
    }

    const payload = {
      cpf: user.cpf,
      id: user.id,
    };

    return {
      id: user.id,
      cpf: user.cpf,
      access_token: this.jwtService.sign(payload),
    };
  }
}
