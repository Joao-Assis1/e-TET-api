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
import { IndividualsService } from './individuals.service';
import {
  CreateIndividualDto,
  UpdateIndividualDto,
  Individual,
} from './individual.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
} from '@nestjs/swagger';
// Importação do AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';
import { MicroareaGuard } from '../users/guards/microarea.guard';
import { RequireMicroareaMatch } from '../users/decorators/microarea.decorator';

@ApiTags('Indivíduos')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('individuals')
export class IndividualsController {
  constructor(private readonly individualsService: IndividualsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo indivíduo' })
  @ApiCreatedResponse({ type: Individual })
  async create(@Body() createIndividualDto: CreateIndividualDto) {
    return this.individualsService.create(createIndividualDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os indivíduos' })
  @ApiOkResponse({ type: [Individual] })
  async findAll(@Req() req: any) {
    const user = req.user;
    const microareaFilter = user.role === 'Admin' ? undefined : user.microarea;
    return this.individualsService.findAll(microareaFilter);
  }

  @Get(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  @ApiOperation({ summary: 'Obter detalhes de um indivíduo' })
  @ApiOkResponse({ type: Individual })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  @ApiOperation({ summary: 'Atualizar dados de um indivíduo' })
  @ApiOkResponse({ type: Individual })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIndividualDto: UpdateIndividualDto,
  ) {
    return this.individualsService.update(id, updateIndividualDto);
  }

  @Delete(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  @ApiOperation({ summary: 'Remover um indivíduo' })
  @ApiOkResponse({ description: 'Indivíduo removido com sucesso' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.remove(id);
  }

  @Patch(':id/saida')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  @ApiOperation({ summary: 'Registrar saída/óbito de um indivíduo' })
  @ApiOkResponse({ type: Individual })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', example: 'Mudança de território' },
      },
    },
  })
  async saida(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
  ) {
    return this.individualsService.registerExit(id, motivo);
  }
}
