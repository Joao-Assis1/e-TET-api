import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { CreateRiskAssessmentDto } from '../dto/create-risk.dto';
import { RiskCalculatorService } from '../services/risk-calculator.service';
import { AuthGuard } from '../../users/guards/auth.guard';
import type { Request } from 'express';

@Controller('families')
@UseGuards(AuthGuard)
export class RiskStratificationController {
  constructor(private readonly riskCalculatorService: RiskCalculatorService) {}

  @Post(':id/risk')
  async calculateRisk(
    @Param('id', ParseUUIDPipe) familyId: string,
    @Body() payload: CreateRiskAssessmentDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId = user?.id || user?.sub || user?.usuario || 'system';

    return this.riskCalculatorService.calculateFeatureRisk(familyId, payload, userId);
  }
}
