import { DashboardType } from '../account.service';

export class CreateAccountDto {
  name!: string;
  email!: string;
  phoneNumber!: string;
  dashboard!: DashboardType;
  configuration?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  identity?: Record<string, unknown>;
}
