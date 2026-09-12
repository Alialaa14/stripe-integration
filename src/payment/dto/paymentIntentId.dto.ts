import { IsString, Matches } from 'class-validator';

export class PaymentIntentParamDto {
  @IsString({ message: 'PaymentIntent ID must be a string' })
  @Matches(/^pi_[a-zA-Z0-9]+$/, {
    message: 'Invalid PaymentIntent ID format',
  })
  paymentIntentId!: string;
}
