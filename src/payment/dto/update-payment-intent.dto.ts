import {
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class UpdatePaymentIntentDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
