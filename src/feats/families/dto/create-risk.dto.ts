import { IsInt, Min, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateRiskAssessmentDto {
  @IsInt()
  @Min(0)
  bedriddenCount: number;

  @IsInt()
  @Min(0)
  physicalDisabilityCount: number;

  @IsInt()
  @Min(0)
  mentalDisabilityCount: number;

  @IsInt()
  @Min(0)
  severeMalnutritionCount: number;

  @IsInt()
  @Min(0)
  drugAddictionCount: number;

  @IsInt()
  @Min(0)
  unemployedCount: number;

  @IsInt()
  @Min(0)
  illiterateCount: number;

  @IsInt()
  @Min(0)
  under6MonthsCount: number;

  @IsInt()
  @Min(0)
  over70YearsCount: number;

  @IsInt()
  @Min(0)
  hypertensionCount: number;

  @IsInt()
  @Min(0)
  diabetesCount: number;

  @IsBoolean()
  poorSanitation: boolean;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  roomsCount: number;
}
