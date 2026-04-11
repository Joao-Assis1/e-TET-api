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
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto, UpdateVisitDto } from './visit.entity';
import { AuthGuard } from '../users/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() createVisitDto: CreateVisitDto) {
    return this.visitsService.create(createVisitDto);
  }

  @Get()
  findAll(
    @Query('household_id') householdId?: string,
    @Query('family_id') familyId?: string,
    @Query('individual_id') individualId?: string,
  ) {
    return this.visitsService.findAll({ householdId, familyId, individualId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitDto: UpdateVisitDto) {
    return this.visitsService.update(id, updateVisitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitsService.remove(id);
  }
}
