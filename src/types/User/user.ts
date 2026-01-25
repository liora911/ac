/**
 * User and subscription types
 */

export interface UserWithSubscription {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    stripePriceId: string;
    stripeSubscriptionId: string;
  } | null;
}
