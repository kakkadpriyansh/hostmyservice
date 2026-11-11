# Developer affiliate program

Approved affiliates (typically developers and agencies) share a referral link and
earn a percentage of what the customers they refer pay. Admins decide who can join,
set the commission, and pay out manually by UPI or bank transfer.

## How it works

```
User applies ──▶ Admin approves ──▶ Affiliate shares /r/<code>
                                          │
Visitor clicks ──▶ cookie (30 days) ──▶ signs up ──▶ User.referredByAffiliateId
                                                          │
Referred customer pays ──▶ activatePayment() ──▶ Commission (PENDING, on hold 7 days)
                                                          │
After the hold, balance ≥ ₹1000 ──▶ Affiliate requests payout ──▶ Admin sends money ──▶ marks PAID with UTR
```

### Joining

1. A logged-in user opens **Dashboard → Affiliate Program** and applies with a
   website/GitHub link and how they plan to refer customers.
2. An admin reviews it in **Admin → Affiliates → Applications**: approve or reject
   (with a note the applicant sees). Rejected users can apply again.
3. Approved affiliates get a code like `PRIYANSH-7K2Q` and a link
   `https://<site>/r/PRIYANSH-7K2Q`.

Only approved affiliates have a working link. Ordinary users can't refer.

### Attribution

- `/r/<code>` (`app/r/[code]/route.ts`) counts the click and sets an `httpOnly`
  cookie `hms_ref` for `cookieDays` (default 30). An existing cookie is never
  overwritten: the first affiliate wins.
- At registration (`registerUser` in `app/actions/auth.ts`), if the cookie names an
  `APPROVED` affiliate and the program is enabled, `User.referredByAffiliateId` is
  set. It's set once and never changes.
- Existing users can't be attributed after the fact.

### Commissions

Created in `recordCommissionForPayment()` (`lib/affiliate.ts`), inside the same
transaction that marks a payment `SUCCESS` (checkout, Razorpay webhook, admin
Force Activate, and auto-renew charges). One commission per payment at most.

```
commission = floor((payment.amount − payment.gstAmount) × rate%)   (in paise)
```

No commission when:

- the program is disabled
- the affiliate isn't `APPROVED` (e.g. suspended)
- the customer is the affiliate themselves
- scope is "first payment only" and the customer already generated a commission

The rate is the affiliate's custom rate if set, otherwise the program default.
The rate in effect is stored on each commission, so changing rates never
changes past commissions.

### Balance states

| State | Meaning |
|---|---|
| On hold | `PENDING`, created less than `holdDays` ago (refund window) |
| Available | `PENDING`, past the hold, not in a payout request |
| In payout | `PENDING`, attached to a `REQUESTED` payout |
| Paid | `PAID` |
| Reversed | `REVERSED` by an admin; never paid |

### Payouts

- The affiliate saves a UPI ID or bank account (name, number, IFSC).
- **Request payout** is enabled when the available balance is at least
  `minPayoutPaise` (default ₹1000), payout details exist, and no request is open.
  The request takes **all** available commissions. It runs in a serializable
  transaction so double-clicks can't create two payouts.
- The admin sends the money outside HostMyService, then in **Admin → Affiliates →
  Payout requests** clicks **Mark paid** and enters the UTR. The affiliate sees the
  reference in their payout history.
- **Reject** (with a reason) puts the commissions back into the available balance.

### Refunds

There is no automatic refund handling. When you refund a referred customer's
payment, open the affiliate in **Admin → Affiliates**, find the commission and
click **Reverse** (only possible before it is part of a payout). The hold period
exists so this normally happens before the money can be withdrawn.

## Admin settings

**Admin → Affiliates → Program settings** (stored in the single
`AffiliateSettings` row):

| Setting | Default | Notes |
|---|---|---|
| Program enabled | on | Off: links stop tracking, no new commissions, no payout requests |
| Accepting applications | on | Off: no new applications; existing affiliates unaffected |
| Default commission | 10% | Per-affiliate override on each affiliate's page |
| Pays commission on | every payment | Or first payment only |
| Minimum payout | ₹1000 | |
| Hold period | 7 days | Keep at least the refund window |
| Referral cookie | 30 days | |

Per affiliate: approve, reject, suspend, reactivate, custom rate, view referrals,
commissions and payouts.

## Code

| Path | Purpose |
|---|---|
| `lib/affiliate.ts` | Settings, commission calculation, balances, payout request |
| `app/r/[code]/route.ts` | Referral link |
| `app/actions/client/affiliate.ts` | Apply, save payout details, request payout |
| `app/actions/admin/affiliates.ts` | Settings, review, rates, payouts, reversals (admin only) |
| `app/dashboard/affiliate/page.tsx` | Affiliate panel |
| `app/admin/affiliates/` | Admin overview and per-affiliate page |
| `components/affiliate/`, `components/admin/affiliates/` | UI |

Models: `Affiliate`, `Commission`, `Payout`, `AffiliateSettings`, plus
`User.referredByAffiliateId`. Money is stored in paise as integers.

## Privacy

Affiliates see referred customers only as masked emails (`pr*****@gmail.com`)
and whether they've paid. Admins see full details. Payout details (UPI, bank
account) are visible only to the affiliate and admins.

## Existing customers

Nothing changes for them: no affiliates exist until an admin approves one, and
users who signed up before can't be attributed to an affiliate.
