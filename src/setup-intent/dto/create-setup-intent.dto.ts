import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSetupIntentDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsIn(['on_session', 'off_session'])
  usage?: 'on_session' | 'off_session';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
