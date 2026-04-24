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
} from './family.entity';
// Importando o AuthGuard customizado do projeto
import { AuthGuard } from '../users/guards/auth.guard';
import { MicroareaGuard } from '../users/guards/microarea.guard';
import { RequireMicroareaMatch } from '../users/decorators/microarea.decorator';

@UseGuards(AuthGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  async create(@Body() createFamilyDto: CreateFamilyDto) {
    return this.familiesService.create(createFamilyDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    const microareaFilter = user.role === 'Admin' ? undefined : user.microarea;
    return this.familiesService.findAll(microareaFilter);
  }

  @Get(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familiesService.update(id, updateFamilyDto);
  }

  @Delete(':id')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.remove(id);
  }

  @Patch(':id/sync')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  async syncFamilyData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('renda_familiar') novaRenda: FamilyIncome,
  ) {
    return this.familiesService.syncFamilyData(id, novaRenda);
  }

  @Patch(':id/mudou')
  @UseGuards(MicroareaGuard)
  @RequireMicroareaMatch('Family')
  async mudou(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.familiesService.registerFamilyMove(id, motivo);
  }
}
