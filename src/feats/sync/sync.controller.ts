import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncFamilyPayloadDto } from './sync.dto';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Sincronização Online (Neon)')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('family')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Sincronizar família e indivíduos do tablet para o Neon (Calcula Risco Coelho-Savassi)' })
  async syncFamily(@Body() payload: SyncFamilyPayloadDto) {
    return this.syncService.syncFamilyData(payload);
  }
}
