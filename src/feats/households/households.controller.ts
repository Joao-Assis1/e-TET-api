import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { HouseholdsService } from './households.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateHouseholdDto,
  UpdateHouseholdDto,
  Household,
} from './household.entity';
import { Individual } from '../individuals/individual.entity';
import { AuthGuard } from '../users/guards/auth.guard';
import { MicroareaGuard } from '../users/guards/microarea.guard';
import { RequireMicroareaMatch } from '../users/decorators/microarea.decorator';

@ApiTags('Domicílios')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo domicílio' })
  @ApiCreatedResponse({ type: Household })
  create(@Body() createHouseholdDto: CreateHouseholdDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.householdsService.create(createHouseholdDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os domicílios' })
  @ApiOkResponse({ type: [Household] })
  @ApiQuery({ name: 'logradouro', required: false, description: 'Filtro por logradouro' })
  findAll(@Req() req: any, @Query('logradouro') logradouro?: string) {
    const user = req.user;
    // Admins podem ver tudo, ACS vê apenas sua microárea
    const microareaFilter = user.role === 'admin' ? undefined : user.microarea;
    return this.householdsService.findAll(logradouro, microareaFilter);
  }

  @Get(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Household')
  @ApiOperation({ summary: 'Obter detalhes de um domicílio' })
  @ApiOkResponse({ type: Household })
  findOne(@Param('id') id: string) {
    return this.householdsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Household')
  @ApiOperation({ summary: 'Atualizar dados de um domicílio' })
  @ApiOkResponse({ type: Household })
  update(
    @Param('id') id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
  ) {
    return this.householdsService.update(id, updateHouseholdDto);
  }

  @Delete(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Household')
  @ApiOperation({ summary: 'Remover um domicílio' })
  @ApiOkResponse({ description: 'Domicílio removido com sucesso' })
  remove(@Param('id') id: string) {
    return this.householdsService.remove(id);
  }

  @Get(':id/individuals')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Household')
  @ApiOperation({
    summary: 'Listar todos os indivíduos de um domicílio (todas as famílias)',
  })
  @ApiOkResponse({ type: [Individual] })
  findIndividuals(@Param('id') id: string) {
    return this.householdsService.findIndividuals(id);
  }
}
