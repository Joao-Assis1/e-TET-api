import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Tenta obter o token do cookie primeiro (HttpOnly)
    let token = request.cookies?.access_token;

    // Fallback para o cabeçalho Authorization (Bearer) se não houver cookie
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = await this.usersService.verifyUserToken(token);
      
      // Validação extra: O usuário ainda existe no banco?
      // Isso evita erros 500 em serviços que dependem do ID do usuário
      const user = await this.usersService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      (request as any).user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido');
    }
  }
}
