import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CheckoutLineItemDto } from './create-checkout-session.dto';
import { Type } from 'class-transformer';
export class UpdateCheckoutSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineItemDto)
  lineItems!: CheckoutLineItemDto[];
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class UpdateCheckoutSessionParam {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class CheckoutSessionParamDto {
  @IsString({ message: 'Checkout session ID must be a string' })
  @IsNotEmpty({ message: 'Checkout session ID is required' })
  // @Matches(/^cs_[a-zA-Z0-9]+$/, {
  //   message: 'Invalid Checkout session ID format',
  // })
  id!: string;
}
