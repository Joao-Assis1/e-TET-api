import { IsInt, Min, Max, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskAssessmentDto {
  @ApiProperty({ description: 'Número de acamados na família', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  bedriddenCount: number;

  @ApiProperty({ description: 'Número de pessoas com deficiência física', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  physicalDisabilityCount: number;

  @ApiProperty({ description: 'Número de pessoas com deficiência mental', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  mentalDisabilityCount: number;

  @ApiProperty({ description: 'Número de pessoas com desnutrição grave', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  severeMalnutritionCount: number;

  @ApiProperty({ description: 'Número de dependentes químicos', example: 0 })
  @IsInt()
  @Min(0)
  @Max(5)
  drugAddictionCount: number;

  @ApiProperty({ description: 'Número de desempregados', example: 1 })
  @IsInt()
  @Min(0)
  @Max(10)
  unemployedCount: number;

  @ApiProperty({ description: 'Número de analfabetos', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  illiterateCount: number;

  @ApiProperty({ description: 'Número de menores de 6 meses', example: 0 })
  @IsInt()
  @Min(0)
  @Max(5)
  under6MonthsCount: number;

  @ApiProperty({ description: 'Número de pessoas com mais de 70 anos', example: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  over70YearsCount: number;

  @ApiProperty({ description: 'Número de hipertensos', example: 1 })
  @IsInt()
  @Min(0)
  @Max(5)
  hypertensionCount: number;

  @ApiProperty({ description: 'Número de diabéticos', example: 0 })
  @IsInt()
  @Min(0)
  @Max(5)
  diabetesCount: number;

  @ApiProperty({ description: 'Possui saneamento básico adequado?', example: true })
  @IsBoolean()
  basicSanitation: boolean;

  @ApiProperty({ description: 'Número de cômodos no domicílio', example: 4 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  roomsCount: number;
}
