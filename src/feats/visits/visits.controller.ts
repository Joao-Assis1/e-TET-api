import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto, UpdateVisitDto, Visit } from './visit.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Visitas')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma nova visita domiciliar' })
  @ApiCreatedResponse({ type: Visit })
  create(@Body() createVisitDto: CreateVisitDto) {
    return this.visitsService.create(createVisitDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar visitas domiciliares' })
  @ApiOkResponse({ type: [Visit] })
  @ApiQuery({ name: 'household_id', required: false, description: 'Filtrar por ID do domicílio' })
  @ApiQuery({ name: 'family_id', required: false, description: 'Filtrar por ID da família' })
  @ApiQuery({ name: 'individual_id', required: false, description: 'Filtrar por ID do indivíduo' })
  findAll(
    @Query('household_id') householdId?: string,
    @Query('family_id') familyId?: string,
    @Query('individual_id') individualId?: string,
    @Request() req?: any,
  ) {
    const user = req?.user;
    const microarea = user?.role === 'admin' ? undefined : user?.microarea;

    return this.visitsService.findAll({
      householdId,
      familyId,
      individualId,
      microarea,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma visita' })
  @ApiOkResponse({ type: Visit })
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de uma visita' })
  @ApiOkResponse({ type: Visit })
  update(@Param('id') id: string, @Body() updateVisitDto: UpdateVisitDto) {
    return this.visitsService.update(id, updateVisitDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro de visita' })
  @ApiOkResponse({ description: 'Visita removida com sucesso' })
  remove(@Param('id') id: string) {
    return this.visitsService.remove(id);
  }
}
