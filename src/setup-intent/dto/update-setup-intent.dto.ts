import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSetupIntentDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
