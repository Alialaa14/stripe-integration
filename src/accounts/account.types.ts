import Stripe from 'stripe';

export type StripeAccountCreateParams = Stripe.V2.Core.AccountCreateParams;
export type StripeAccountUpdateParams = Stripe.V2.Core.AccountUpdateParams;
export type StripeAccountResource = Stripe.V2.Core.Account;

export type StripeAccountConfiguration =
  Stripe.V2.Core.AccountCreateParams.Configuration;
export type StripeAccountDefaults = Stripe.V2.Core.AccountCreateParams.Defaults;
export type StripeAccountIdentity = Stripe.V2.Core.AccountCreateParams.Identity;

export type StripeAccountUpdateConfiguration = StripeAccountConfiguration;
export type StripeAccountUpdateDefaults = StripeAccountDefaults;
export type StripeAccountUpdateIdentity = StripeAccountIdentity;

export type StripeAccountDashboard =
  Stripe.V2.Core.AccountCreateParams.Dashboard;
export type StripeAppliedConfiguration =
  Stripe.V2.Core.Account.AppliedConfiguration;

export const DEFAULT_ACCOUNT_CONFIGURATION: StripeAccountConfiguration = {
  customer: {},
};

export const DEFAULT_ACCOUNT_DEFAULTS: StripeAccountDefaults = {
  currency: 'usd',
  locales: ['en-US'],
  responsibilities: {
    fees_collector: 'stripe',
    losses_collector: 'stripe',
  },
};

export const DEFAULT_ACCOUNT_IDENTITY: StripeAccountIdentity = {
  country: 'US',
  entity_type: 'individual',
};
