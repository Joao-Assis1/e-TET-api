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
import { FamiliesService } from './families.service';
import { CreateFamilyDto, UpdateFamilyDto, FamilyIncome } from './family.entity';
// Importando o AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';

// @UseGuards(AuthGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  async create(@Body() createFamilyDto: CreateFamilyDto) {
    return this.familiesService.create(createFamilyDto);
  }

  @Get()
  async findAll() {
    return this.familiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(id, updateFamilyDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.remove(id);
  }

  @Patch(':id/sync')
  async syncFamilyData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('renda_familiar') novaRenda: FamilyIncome,
  ) {
    return this.familiesService.syncFamilyData(id, novaRenda);
  }

  @Patch(':id/mudou')
  async mudou(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.familiesService.registerFamilyMove(id, motivo);
  }
}
