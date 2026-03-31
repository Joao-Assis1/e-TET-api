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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { usuario, senha } = createUserDto;
    const existingUser = await this.usersRepository.findOneBy({ usuario });
    if (existingUser) {
      throw new ConflictException('Usuário já existe');
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = new User({
      ...createUserDto,
      senha: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findByUsername(usuario: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ usuario });
  }

  async verifyUserToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
