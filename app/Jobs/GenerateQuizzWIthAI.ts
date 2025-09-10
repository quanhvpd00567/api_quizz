import { Job } from '@rlanz/bull-queue'

interface RegisterStripeCustomerPayload {
  userId: string;
  data: any;
};

export default class RegisterStripeCustomer extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  public async handle(payload: RegisterStripeCustomerPayload) {
    console.log('RegisterStripeCustomer job started with payload:', payload);
  }

  public async rescue(payload: RegisterStripeCustomerPayload, error: Error) {
    console.error('Failed to register Stripe customer for user:', payload.userId, 'Error:', error);
  }
}