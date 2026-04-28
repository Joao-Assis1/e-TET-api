import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Individual } from '../individuals/individual.entity';
import { Family } from '../families/family.entity';
import { Household } from '../households/household.entity';
import { IndividualHealth } from '../individuals/individual-health.entity';
import { FamilyRiskStratification } from '../families/entities/family-risk.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Individual,
      Family,
      Household,
      IndividualHealth,
      FamilyRiskStratification,
    ]),
    UsersModule, // Necessário para o AuthGuard se ele depender do UsersService
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
