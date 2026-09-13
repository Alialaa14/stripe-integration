import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';

export class CheckoutLineItemDto {
  @IsString()
  priceId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateCheckoutSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineItemDto)
  lineItems!: CheckoutLineItemDto[];

  @IsUrl()
  @IsOptional()
  successUrl?: string;

  @IsUrl()
  @IsOptional()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
