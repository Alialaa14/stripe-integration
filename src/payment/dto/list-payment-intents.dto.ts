import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListPaymentIntentsDto {
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

  @IsOptional()
  @IsDateString()
  createdGt?: string;

  @IsOptional()
  @IsDateString()
  createdLt?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;
}