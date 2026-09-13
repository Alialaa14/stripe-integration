import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListCheckoutSessionsDto {
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
  @IsIn(['open', 'complete', 'expired'])
  status?: 'open' | 'complete' | 'expired';

  @IsOptional()
  @IsDateString()
  createdGte?: string;

  @IsOptional()
  @IsDateString()
  createdLte?: string;

  @IsOptional()
  @IsDateString()
  createdGt?: string;

  @IsOptional()
  @IsDateString()
  createdLt?: string;
}
