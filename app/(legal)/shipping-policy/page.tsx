export default function ShippingPolicyPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Shipping and Delivery Policy</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Digital Delivery</h2>
          <p>
            HostMyService provides purely digital services. No physical products will be shipped or delivered to your address.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Delivery Timing</h2>
          <p>
            Upon successful payment, your subscription and associated services (such as hosting plans) are activated immediately. You will receive a confirmation email with your order details and instructions on how to access your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Accessing Your Services</h2>
          <p>
            You can access your purchased services by logging into your account dashboard at <a href="/dashboard" className="text-primary hover:underline">/dashboard</a>. If you do not see your active plan immediately after payment, please try refreshing the page or contact support.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Support</h2>
          <p>
            If you experience any issues with the delivery or activation of your service, please contact us at hostmyservice@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
