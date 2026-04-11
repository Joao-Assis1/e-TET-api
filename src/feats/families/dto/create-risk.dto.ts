import { IsInt, Min, Max, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateRiskAssessmentDto {
  @IsInt()
  @Min(0)
  @Max(10)
  bedriddenCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  physicalDisabilityCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  mentalDisabilityCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  severeMalnutritionCount: number;

  @IsInt()
  @Min(0)
  @Max(5)
  drugAddictionCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  unemployedCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  illiterateCount: number;

  @IsInt()
  @Min(0)
  @Max(5)
  under6MonthsCount: number;

  @IsInt()
  @Min(0)
  @Max(10)
  over70YearsCount: number;

  @IsInt()
  @Min(0)
  @Max(5)
  hypertensionCount: number;

  @IsInt()
  @Min(0)
  @Max(5)
  diabetesCount: number;

  @IsBoolean()
  basicSanitation: boolean;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  roomsCount: number;
}
