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

    // Se o usuário não estiver injetado (AuthGuard não rodou) ou
    // se ele não tem microárea atrelada no token, deixamos passar (permissão de gestor/admin)
    if (!user || !user.microarea) {
      return true;
    }

    const resourceId = request.params.id;
    if (!resourceId) {
      return true; // Não há ID para checar
    }

    let resourceMicroarea: string | null = null;

    if (entityType === 'Household') {
      const household = await this.dataSource.manager.findOne(Household, {
        where: { id: resourceId as string },
        select: ['microarea'],
      });
      resourceMicroarea = household?.microarea ?? null;
    }

    if (resourceMicroarea && resourceMicroarea !== user.microarea) {
      throw new ForbiddenException(
        `Acesso negado: O recurso pertence à microárea ${resourceMicroarea}, mas você está vinculado à microárea ${user.microarea}.`,
      );
    }

    return true;
  }
}
