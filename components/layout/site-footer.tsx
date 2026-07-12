import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="HostMyService"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-xl font-display font-bold tracking-tight text-white">HostMyService</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Next-generation static hosting platform. Zero config. Infinite scale. Instant global CDN.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:hostmyservice@gmail.com" className="hover:text-white transition-colors">
                  hostmyservice@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} HostMyService. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {/* Social Links could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
