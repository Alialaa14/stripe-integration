import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class CreatePaymentIntentDto {
  @IsInt()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  @IsBoolean()
  saveItLater?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
