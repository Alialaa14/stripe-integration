export type AppliedConfiguration = 'customer' | 'merchant' | 'recipient';

export class ListAccountsDto {
  limit?: string;
  appliedConfigurations?: AppliedConfiguration[];
  closed?: string;
}
