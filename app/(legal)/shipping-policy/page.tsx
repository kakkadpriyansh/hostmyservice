export default function ShippingPolicyPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Shipping & Delivery Policy</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Digital Delivery</h2>
          <p>
            HostMyService provides digital hosting services and related digital products. As our services are entirely digital, no physical shipping is involved.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Delivery Timeframes</h2>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Hosting Plans:</strong> Instant activation upon successful payment confirmation.</li>
            <li><strong>SSL Certificates:</strong> Provisioned automatically once DNS configuration is verified.</li>
            <li><strong>Custom Deployments:</strong> Typically completed within minutes of archive upload.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Accessing Your Services</h2>
          <p>
            You can access your purchased services by logging into your account dashboard at{" "}
            <a href="/dashboard" className="text-[#00D2FF] hover:underline">
              /dashboard
            </a>. If you do not see your active plan immediately after payment, please try refreshing the page or contact support directly at{" "}
            <a href="tel:+918401661887" className="text-[#00D2FF] hover:underline font-semibold">
              +91 84016 61887
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Support</h2>
          <p>
            If you experience any issues with the delivery or activation of your service, please reach out to us at{" "}
            <a href="mailto:hostmyservice@gmail.com" className="text-[#00D2FF] hover:underline">
              hostmyservice@gmail.com
            </a>{" "}
            or via phone / WhatsApp at{" "}
            <a href="tel:+918401661887" className="text-[#00D2FF] hover:underline font-semibold">
              +91 84016 61887
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
