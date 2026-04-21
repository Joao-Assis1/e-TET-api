import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncBatchPayloadDto } from './sync.dto';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Sincronização Offline-First')
@Controller('sync')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('initial')
  @ApiOperation({
    summary: 'Baixar base de dados inicial para o tablet (Offline-First)',
  })
  async getInitialData(@Request() req: any) {
    // req.user.id contém o ID gerado pelo JwtService (conforme definido no LoginService)
    return this.syncService.getInitialSyncData(req.user.id);
  }

  @Post('batch')
  @ApiOperation({
    summary:
      'Sincronizar Lote (Batch) de Domicílios, Famílias, Indivíduos e Visitas do tablet para a API (Calcula Risco Coelho-Savassi)',
  })
  async syncBatch(@Body() payload: SyncBatchPayloadDto, @Request() req: any) {
    console.log(`[SyncController] Recebido lote de sync do usuário ${req.user?.id}`);
    return this.syncService.processBatchSync(payload, req.user.id);
  }
}
