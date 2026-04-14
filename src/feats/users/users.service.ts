import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, CreateUserDto } from './user.entity';

/**
 * Serviço de autenticação e gestão de usuários (Agentes de Saúde).
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Cria um novo usuário com senha criptografada.
   * @param createUserDto Dados do novo usuário.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { usuario, senha } = createUserDto;

    // Verifica existencia prévia
    const existingUser = await this.usersRepository.findOneBy({ usuario });
    if (existingUser) {
      throw new ConflictException('Usuário já existe');
    }

    // Hash da senha usando bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = new User({
      ...createUserDto,
      senha: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Busca um usuário pelo nome de usuário exclusivo.
   */
  async findByUsername(usuario: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ usuario });
  }

  /**
   * Valida um token JWT e retorna o payload contido nele.
   * Utilizado pelo AuthGuard para proteger as rotas.
   */
  async verifyUserToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
