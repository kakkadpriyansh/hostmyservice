import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-display text-white">Contact Us</h1>
        <p className="text-lg text-gray-400">
          Have questions? We're here to help. Reach out to us through any of the channels below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Email Us</h3>
              <p className="text-gray-400 text-sm mt-1">For general inquiries and support</p>
              <a href="mailto:hostmyservice@gmail.com" className="text-primary hover:text-primary/80 transition-colors mt-2 block font-medium">
                hostmyservice@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-6">Send us a message</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-300">First Name</label>
                <input type="text" id="firstName" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-300">Last Name</label>
                <input type="text" id="lastName" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
              <input type="email" id="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-300">Message</label>
              <textarea id="message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"></textarea>
            </div>
            <button type="button" className="w-full bg-primary text-black font-semibold py-2.5 rounded-lg hover:bg-white transition-all duration-300">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
