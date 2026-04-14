import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndividualsService } from './individuals.service';
import { IndividualsController } from './individuals.controller';
import { Individual } from './individual.entity';
import { IndividualHealth } from './individual-health.entity';
import { Family } from '../families/family.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Individual, IndividualHealth, Family]),
    UsersModule,
  ],
  controllers: [IndividualsController],
  providers: [IndividualsService],
  exports: [IndividualsService],
})
export class IndividualsModule {}
