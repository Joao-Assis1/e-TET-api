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
} from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CreateHouseholdDto,
  UpdateHouseholdDto,
} from './household.entity';
import { AuthGuard } from '../users/guards/auth.guard';

@ApiTags('Domicílios')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  create(@Body() createHouseholdDto: CreateHouseholdDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.householdsService.create(createHouseholdDto, userId);
  }

  @Get()
  findAll() {
    return this.householdsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.householdsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
  ) {
    return this.householdsService.update(id, updateHouseholdDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.householdsService.remove(id);
  }
}
