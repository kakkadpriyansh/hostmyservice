import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20 bg-white/10 text-xs font-bold text-white mb-2">
          <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
          Get in Touch
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">Contact Us</h1>
        <p className="text-lg text-blue-200/70 max-w-xl mx-auto">
          Have questions or need assistance? Reach out to us directly through any channel below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Phone Contact */}
          <div className="glass p-5 sm:p-7 rounded-2xl sm:rounded-[24px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30 shrink-0">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">Call Us Directly</h3>
                <p className="text-blue-200/70 text-xs sm:text-sm mt-1">Available for sales & emergency support</p>
                <a href="tel:+918401661887" className="text-[#00D2FF] hover:text-white transition-colors mt-2 block font-bold text-sm sm:text-base">
                  +91 84016 61887
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className="glass p-5 sm:p-7 rounded-2xl sm:rounded-[24px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">WhatsApp Support</h3>
                <p className="text-blue-200/70 text-xs sm:text-sm mt-1">Instant chat with our engineering team</p>
                <a
                  href="https://wa.me/918401661887"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-white transition-colors mt-2 block font-bold text-sm sm:text-base"
                >
                  +91 84016 61887
                </a>
              </div>
            </div>
          </div>

          {/* Email Support */}
          <div className="glass p-5 sm:p-7 rounded-2xl sm:rounded-[24px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">Email Us</h3>
                <p className="text-blue-200/70 text-xs sm:text-sm mt-1">For general inquiries, billing, and technical help</p>
                <a href="mailto:hostmyservice@gmail.com" className="text-violet-300 hover:text-white transition-colors mt-2 block font-bold text-sm sm:text-base break-all">
                  hostmyservice@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-[24px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xl font-bold font-display text-white mb-2">Send us a message</h3>
          <p className="text-xs text-blue-200/60 mb-6">Fill out the form below or call us at +91 84016 61887</p>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-xs font-semibold text-blue-100">First Name</label>
                <input type="text" id="firstName" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-blue-200/40 focus:outline-none focus:border-[#00D2FF] text-sm" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-xs font-semibold text-blue-100">Last Name</label>
                <input type="text" id="lastName" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-blue-200/40 focus:outline-none focus:border-[#00D2FF] text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-blue-100">Email Address</label>
              <input type="email" id="email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-blue-200/40 focus:outline-none focus:border-[#00D2FF] text-sm" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-xs font-semibold text-blue-100">Message</label>
              <textarea id="message" rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-blue-200/40 focus:outline-none focus:border-[#00D2FF] text-sm"></textarea>
            </div>
            <button
              type="button"
              className="w-full bg-[#00D2FF] text-[#07133B] font-bold py-3 rounded-xl hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_30px_rgba(0,210,255,0.6)]"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
