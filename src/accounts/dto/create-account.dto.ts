import {
  StripeAccountConfiguration,
  StripeAccountDefaults,
  StripeAccountIdentity,
} from '../account.types';
import { DashboardType } from '../account.service';

export class CreateAccountDto {
  name!: string;
  email!: string;
  phoneNumber!: string;
  dashboard!: DashboardType;
  configuration?: StripeAccountConfiguration;
  defaults?: StripeAccountDefaults;
  identity?: StripeAccountIdentity;
}
