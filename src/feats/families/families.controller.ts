import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { FamiliesService } from './families.service';
import {
  CreateFamilyDto,
  UpdateFamilyDto,
  FamilyIncome,
  Family,
} from './family.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
} from '@nestjs/swagger';
// Importando o AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';
import { MicroareaGuard } from '../users/guards/microarea.guard';
import { RequireMicroareaMatch } from '../users/decorators/microarea.decorator';

@ApiTags('Famílias')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova família' })
  @ApiCreatedResponse({ type: Family })
  async create(@Body() createFamilyDto: CreateFamilyDto) {
    return this.familiesService.create(createFamilyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as famílias' })
  @ApiOkResponse({ type: [Family] })
  async findAll(@Req() req: any) {
    const user = req.user;
    const microareaFilter = user.role === 'Admin' ? undefined : user.microarea;
    return this.familiesService.findAll(microareaFilter);
  }

  @Get(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  @ApiOperation({ summary: 'Obter detalhes de uma família' })
  @ApiOkResponse({ type: Family })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  @ApiOperation({ summary: 'Atualizar dados de uma família' })
  @ApiOkResponse({ type: Family })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(id, updateFamilyDto);
  }

  @Delete(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  @ApiOperation({ summary: 'Remover uma família' })
  @ApiOkResponse({ description: 'Família removida com sucesso' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.remove(id);
  }

  @Patch(':id/sync')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  @ApiOperation({ summary: 'Atualizar renda familiar (Sincronização)' })
  @ApiOkResponse({ type: Family })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        renda_familiar: { type: 'string', enum: Object.values(FamilyIncome) },
      },
    },
  })
  async syncFamilyData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('renda_familiar') novaRenda: FamilyIncome,
  ) {
    return this.familiesService.syncFamilyData(id, novaRenda);
  }

  @Patch(':id/mudou')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  @ApiOperation({ summary: 'Registrar mudança da família' })
  @ApiOkResponse({ type: Family })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', example: 'Mudou-se para outra cidade' },
      },
    },
  })
  async mudou(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.familiesService.registerFamilyMove(id, motivo);
  }
}
