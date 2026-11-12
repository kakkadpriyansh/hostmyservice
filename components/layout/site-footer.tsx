import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#051136]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="HostMyService Logo"
                className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md border border-white/20"
              />
              <span className="text-xl font-display font-extrabold tracking-tight text-white">HostMyService</span>
            </div>
            <p className="text-sm text-blue-200/70 leading-relaxed max-w-xs">
              Next-generation static & full-stack hosting platform. Zero config. Infinite scale. Instant global performance.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy-policy" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-sm text-blue-200/70 hover:text-[#00D2FF] transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Contact</h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-blue-200/70">
                <Mail className="h-4 w-4 text-[#00D2FF] shrink-0 mt-0.5" />
                <a href="mailto:hostmyservice@gmail.com" className="hover:text-white transition-colors">
                  hostmyservice@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-200/70">
                <Phone className="h-4 w-4 text-[#00D2FF] shrink-0 mt-0.5" />
                <a href="tel:+918401661887" className="hover:text-white transition-colors font-medium">
                  +91 84016 61887
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-200/70">
                <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/918401661887"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-blue-200/60">
            © {new Date().getFullYear()} HostMyService. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
