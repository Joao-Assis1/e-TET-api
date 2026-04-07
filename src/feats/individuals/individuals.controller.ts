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
} from '@nestjs/common';
import { IndividualsService } from './individuals.service';
import { CreateIndividualDto, UpdateIndividualDto } from './individual.entity';
// Importação do AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';

// @UseGuards(AuthGuard)
@Controller('individuals')
export class IndividualsController {
  constructor(private readonly individualsService: IndividualsService) {}

  @Post()
  async create(@Body() createIndividualDto: CreateIndividualDto) {
    return this.individualsService.create(createIndividualDto);
  }

  @Get()
  async findAll() {
    return this.individualsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIndividualDto: UpdateIndividualDto,
  ) {
    return this.individualsService.update(id, updateIndividualDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.individualsService.remove(id);
  }

  @Patch(':id/saida')
  async saida(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
  ) {
    return this.individualsService.registerExit(id, motivo);
  }
}
