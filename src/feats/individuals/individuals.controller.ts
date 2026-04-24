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
import { CreateIndividualDto, UpdateIndividualDto } from './individual.entity';
// Importação do AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';
import { MicroareaGuard } from '../users/guards/microarea.guard';
import { RequireMicroareaMatch } from '../users/decorators/microarea.decorator';

@UseGuards(AuthGuard)
@Controller('individuals')
export class IndividualsController {
  constructor(private readonly individualsService: IndividualsService) {}

  @Post()
  async create(@Body() createIndividualDto: CreateIndividualDto) {
    return this.individualsService.create(createIndividualDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    const microareaFilter = user.role === 'Admin' ? undefined : user.microarea;
    return this.individualsService.findAll(microareaFilter);
  }

  @Get(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIndividualDto: UpdateIndividualDto,
  ) {
    return this.individualsService.update(id, updateIndividualDto);
  }

  @Delete(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.remove(id);
  }

  @Patch(':id/saida')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Individual')
  async saida(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
  ) {
    return this.individualsService.registerExit(id, motivo);
  }
}
