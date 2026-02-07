export default function RefundPolicyPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Refund and Cancellation Policy</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time through your dashboard. Your subscription will remain active until the end of the current billing period, after which it will not renew. We do not provide refunds for partial subscription periods.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Refund Policy</h2>
          <p>
            Due to the nature of digital services and server resources allocated upon purchase, we generally do not offer refunds once the service has been provisioned and used.
          </p>
          <p className="mt-4">
            However, we may consider refund requests on a case-by-case basis if:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>There was a technical error that prevented you from using the service, and our support team was unable to resolve it within a reasonable timeframe (48 hours).</li>
            <li>You were charged incorrectly due to a billing error.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Refund Process</h2>
          <p>
            To request a refund, please contact our support team at hostmyservice@gmail.com with your transaction details and the reason for the request. Approved refunds will be processed within 5-7 business days to the original method of payment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Chargebacks</h2>
          <p>
            If you initiate a chargeback or dispute with your payment provider, your account will be suspended immediately until the dispute is resolved. We recommend contacting us first to resolve any billing issues.
          </p>
        </section>
      </div>
    </div>
  );
}
