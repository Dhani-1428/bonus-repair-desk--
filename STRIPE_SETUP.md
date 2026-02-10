# Stripe Payment Gateway Integration Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
```

## Webhook Setup

1. Go to your Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
5. Copy the "Signing secret" and add it to `STRIPE_WEBHOOK_SECRET` in your `.env.local` file

## How It Works

1. **User selects a plan** on the billing page
2. **Checkout session is created** via `/api/checkout/create-session`
3. **User is redirected** to Stripe Checkout
4. **After payment**, user is redirected to `/checkout/success`
5. **Stripe webhook** (`/api/webhooks/stripe`) processes the payment and activates the subscription
6. **User receives confirmation email** automatically

## Testing

For testing with test cards, use Stripe's test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

## Important Notes

- The webhook must be configured for payments to be automatically processed
- Without the webhook, payments will be completed but subscriptions won't be activated automatically
- Make sure your webhook endpoint is accessible from the internet (not localhost)
