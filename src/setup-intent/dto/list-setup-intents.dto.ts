import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListSetupIntentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  startingAfter?: string;

  @IsOptional()
  @IsString()
  endingBefore?: string;

  @IsOptional()
  @IsDateString()
  createdGte?: string;

  @IsOptional()
  @IsDateString()
  createdLte?: string;
}
