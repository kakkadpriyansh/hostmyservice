export default function RefundPolicyPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Cancellation & Refund Policy</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time through your account dashboard. Upon cancellation, your service will remain active until the end of your current billing period, after which it will not renew.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Refund Eligibility</h2>
          <p>We offer refunds under the following conditions:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Within 7 days of purchase:</strong> If you are not satisfied with our service, you are eligible for a full refund within 7 days of your initial plan purchase.</li>
            <li><strong>Service downtime:</strong> If our service experiences downtime exceeding our SLA commitments, you may be eligible for a pro-rated refund or service credit.</li>
            <li><strong>Non-refundable:</strong> Domain registration fees, customized setup fees, and renewal payments are non-refundable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Refund Process</h2>
          <p>
            To request a refund, please contact our support team at{" "}
            <a href="mailto:hostmyservice@gmail.com" className="text-[#00D2FF] hover:underline">
              hostmyservice@gmail.com
            </a>{" "}
            or via phone/WhatsApp at{" "}
            <a href="tel:+918401661887" className="text-[#00D2FF] hover:underline font-semibold">
              +91 84016 61887
            </a>{" "}
            with your transaction details and the reason for the request. Approved refunds will be processed within 5-7 business days to the original method of payment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Chargebacks</h2>
          <p>
            If you initiate a chargeback or dispute with your payment provider, your account will be suspended immediately until the dispute is resolved. We recommend contacting us first at +91 84016 61887 to resolve any billing issues directly.
          </p>
        </section>
      </div>
    </div>
  );
}
