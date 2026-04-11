import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from './feats/login/login.module';
import { UsersModule } from './feats/users/users.module';
import { User } from './feats/users/user.entity';
import { FamiliesModule } from './feats/families/families.module';
import { Family } from './feats/families/family.entity';
import { IndividualsModule } from './feats/individuals/individuals.module';
import { Individual } from './feats/individuals/individual.entity';
import { IndividualHealth } from './feats/individuals/individual-health.entity';
import { FamilyRiskStratification } from './feats/families/entities/family-risk.entity';
import { SyncModule } from './feats/sync/sync.module';
import { HouseholdsModule } from './feats/households/households.module';
import { Household } from './feats/households/household.entity';
import { VisitsModule } from './feats/visits/visits.module';
import { Visit } from './feats/visits/visit.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';

        if (isProduction) {
          return {
            type: 'postgres',
            url: configService.get('DATABASE_URL'),
            entities: [User, Family, Individual, IndividualHealth, Household, Visit, FamilyRiskStratification],
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'sqlite',
          database: 'database.sqlite',
          entities: [User, Family, Individual, IndividualHealth, Household, Visit, FamilyRiskStratification],
          synchronize: true,
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(
          'JWT_SECRET',
          'e-tet-default-secret-change-me',
        ),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    LoginModule,
    UsersModule,
    FamiliesModule,
    IndividualsModule,
    SyncModule,
    HouseholdsModule,
    VisitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
