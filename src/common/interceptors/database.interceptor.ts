import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { QueryFailedError } from 'typeorm';

/**
 * Interceptor para capturar erros específicos de banco de dados e transformá-los
 * em exceções HTTP amigáveis (Ex: Violação de chave única).
 */
@Injectable()
export class DatabaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Verifica se é um erro do TypeORM
        if (error instanceof QueryFailedError) {
          const errorMessage = error.message.toLowerCase();
          const errorCode = (error as any).code;

          // SQLite: SQLITE_CONSTRAINT_UNIQUE ou Postgres: 23505
          if (
            errorCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
            errorCode === '23505' ||
            errorMessage.includes('unique constraint') ||
            errorMessage.includes('already exists')
          ) {
            return throwError(
              () =>
                new BadRequestException(
                  'Este registro já existe ou viola uma restrição de unicidade.',
                ),
            );
          }
        }

        // Se não for um erro tratado, repassa a exceção
        return throwError(() => error);
      }),
    );
  }
}
