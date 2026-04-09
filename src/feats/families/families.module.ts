import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './family.entity';
import { FamilyRiskStratification } from './entities/family-risk.entity';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { RiskCalculatorService } from './services/risk-calculator.service';
import { RiskStratificationController } from './controllers/risk.controller';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyRiskStratification]), UsersModule],
  controllers: [FamiliesController, RiskStratificationController],
  providers: [FamiliesService, RiskCalculatorService],
  exports: [FamiliesService, RiskCalculatorService],
})
export class FamiliesModule {}
