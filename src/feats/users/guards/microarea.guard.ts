import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { REQUIRE_MICROAREA_MATCH_KEY } from '../decorators/microarea.decorator';
import { Household } from '../../households/household.entity';
import { UserRole } from '../user.entity';

@Injectable()
export class MicroareaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entityType = this.reflector.get<string>(
      REQUIRE_MICROAREA_MATCH_KEY,
      context.getHandler(),
    );

    if (!entityType) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user: any = (request as any).user;

    // Se não houver usuário no request (AuthGuard não rodou), negamos por segurança
    if (!user) {
      return false;
    }

    // Administradores têm acesso total a todos os territórios
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // ACS deve ter uma microárea definida
    if (!user.microarea) {
      throw new ForbiddenException(
        'Acesso negado: Seu usuário não possui uma microárea vinculada.',
      );
    }

    const resourceId = request.params.id;
    if (!resourceId) {
      return true; // Não há ID específico para checar neste contexto (ex: listagem global se permitida)
    }

    let resourceMicroarea: string | null = null;

    if (entityType === 'Household') {
      const household = await this.dataSource.manager.findOne(Household, {
        where: { id: resourceId as string },
        select: ['microarea'],
      });
      resourceMicroarea = household?.microarea ?? null;
    } else if (entityType === 'Family') {
      const family = await this.dataSource.manager
        .getRepository('Family')
        .findOne({
          where: { id: resourceId as string },
          relations: ['household'],
        });
      resourceMicroarea = family?.household?.microarea ?? null;
    } else if (entityType === 'Individual') {
      const individual = await this.dataSource.manager
        .getRepository('Individual')
        .findOne({
          where: { id: resourceId as string },
          relations: ['household'],
        });
      resourceMicroarea = individual?.household?.microarea ?? null;
    }

    if (resourceMicroarea && resourceMicroarea !== user.microarea) {
      throw new ForbiddenException(
        `Acesso negado: O recurso pertence à microárea ${resourceMicroarea}, mas você está vinculado à microárea ${user.microarea}.`,
      );
    }

    return true;
  }
}
