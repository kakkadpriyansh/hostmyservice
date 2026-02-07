export default function TermsPage() {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">Terms and Conditions</h1>
      <p className="text-gray-400 text-lg mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-8 text-gray-300">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using HostMyService, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of HostMyService and its licensors.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Termination</h2>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
          <p>
            In no event shall HostMyService, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at hostmyservice@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
