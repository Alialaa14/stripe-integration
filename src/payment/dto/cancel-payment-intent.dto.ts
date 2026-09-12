import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelPaymentIntentDto {
  @IsString({ message: 'Cancellation reason must be a string' })
  @IsOptional()
  @MaxLength(100, {
    message: 'Cancellation reason must be at most 100 characters',
  })
  cancellationReason: string;
}
