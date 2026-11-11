# Payments and subscriptions

Razorpay handles payment. HostMyService records a `Payment` row per checkout
and turns successful payments into `Subscription` rows.

## Pricing

`Plan.price` is a **yearly** price in rupees. Customers can buy 1, 2 or 3 years:

| Years | Charged |
|---|---|
| 1 | `price` |
| 2 | `price2Years`, or `price × 2` if unset |
| 3 | `price3Years`, or `price × 3` if unset |

A subscription lasts `durationYears` years from activation
(`subscriptionEndDate()` in `lib/subscriptions.ts`). `Plan.duration` (days) is
only used when an admin creates a website directly from Admin → Websites → New.

## One-time purchase (Razorpay Order)

```
Customer      createSubscriptionOrder()       Razorpay          verifyPayment()        Webhook
   │ ── buy ──▶ Payment PENDING (orderId) ──▶ checkout ──▶ handler ──▶ activatePayment()
   │                                              └── payment.captured ──────────▶ activatePayment()
```

Both `verifyPayment` (called from the browser after checkout) and the
`payment.captured` webhook call `activatePayment()`. Whichever arrives first
activates; the other is a no-op. This means activation works even if the
customer closes the tab before the handler runs.

`verifyPayment` also checks that the order belongs to the logged-in user and
verifies the Razorpay signature.

## Auto-renew (Razorpay Subscription)

Plans with `autoRenew` and an `autoRenewPlanId` (a Razorpay plan ID) create a
Razorpay Subscription instead of an Order.

| Event | Handling |
|---|---|
| First charge (`subscription.charged` with a PENDING payment, or `verifyPayment`) | `activatePayment()`. The `Subscription` row is keyed by `razorpaySubscriptionId`. |
| Later charges (`subscription.charged`) | A new `SUCCESS` payment row; the subscription's `endDate` extends from the current end date (or from now if already expired). A site suspended for expiry is resumed. |
| Redelivered `subscription.charged` | Ignored: a payment with that `razorpayPaymentId` already exists. |
| `subscription.cancelled` | Subscription `CANCELLED`, `autoRenew` off. The site keeps working until `endDate`. |

## `activatePayment()` guarantees

`lib/subscriptions.ts`, in one database transaction:

1. `UPDATE Payment SET status = 'SUCCESS' WHERE id = ? AND status <> 'SUCCESS'`.
   If no row changed, return `already_processed`. Concurrent callers block on
   the row lock and then see zero rows, so only one proceeds.
2. Create the subscription (or renew the linked one, or upsert by
   `razorpaySubscriptionId`).
3. Link the payment to the subscription.

After the transaction, a site suspended for expiry is resumed.

**Never create a `Subscription` for a payment anywhere else.**

## Admin "Force Activate"

Admin → Payments → Force Activate calls `activatePayment()` for a pending
payment. Use it when a customer paid but neither the webhook nor the browser
callback arrived. Check the payment in the Razorpay dashboard first.

## Webhook setup

Razorpay Dashboard → Settings → Webhooks:

- URL: `https://<app-domain>/api/webhook/razorpay`
- Secret: a random string; put the same value in `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `subscription.charged`, `subscription.cancelled`

If `RAZORPAY_WEBHOOK_SECRET` is unset, the webhook is verified with
`RAZORPAY_KEY_SECRET` (the old behaviour). That only works if you set the
webhook secret to the same value as the key secret.

## Testing

Use Razorpay test mode keys. To check the webhook locally, expose the dev
server with a tunnel and point a test-mode webhook at it. Things to verify:

- Paying once creates exactly one subscription, even after refreshing the success page.
- Resending the webhook from the Razorpay dashboard doesn't create a second subscription.
- An expired, suspended site comes back after an auto-renew charge.
