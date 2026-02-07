export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Privacy Policy</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            HostMyService ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
          <p>We collect information that you provide directly to us when you register, make a purchase, or contact us. This may include:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Personal identification (Name, Email address, Phone number)</li>
            <li>Billing information (Credit card details, Billing address)</li>
            <li>Technical data (IP address, Browser type, Operating system)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
          <p>We use the collected data for various purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer support</li>
            <li>To process payments</li>
            <li>To monitor the usage of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
          <p>
            The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>By email: hostmyservice@gmail.com</li>
            <li>By visiting this page on our website: /contact</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
