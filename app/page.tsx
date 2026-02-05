import Link from "next/link";
import { ArrowRight, Check, Server, Zap, Globe, Lock, Code, Cpu, Shield } from "lucide-react";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Plan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let plans: Plan[] = [];
  try {
    plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch plans from database", { error });
    plans = [
      { id: "basic", name: "Basic", price: 0, duration: 30, description: "Perfect for personal projects", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: "pro", name: "Pro", price: 499, duration: 30, description: "For professional developers", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: "business", name: "Business", price: 999, duration: 30, description: "For high-traffic sites", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
  }

  if (plans.length === 0) {
      plans = [
        { id: "basic", name: "Basic", price: 0, duration: 30, description: "Perfect for personal projects", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "pro", name: "Pro", price: 499, duration: 30, description: "For professional developers", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "business", name: "Business", price: 999, duration: 30, description: "For high-traffic sites", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
  }

  return (
    <div className="relative min-h-screen flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
      <div className="glow-point top-[-100px] left-[-100px] opacity-30 animate-pulse-glow"></div>
      <div className="glow-point bottom-[-100px] right-[-100px] opacity-20 animate-pulse-glow" style={{ animationDelay: "1.5s" }}></div>

      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 group-hover:border-primary/50 transition-colors duration-300">
              <Server className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white group-hover:text-primary transition-colors">HostMyService</span>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="relative px-6 py-2.5 text-sm font-semibold text-black bg-primary rounded-full hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="relative px-6 py-2.5 text-sm font-semibold text-black bg-primary rounded-full hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 pt-32">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-primary mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v2.0 is live. Experience the speed.
              </div>
              
              <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Deploy to the <br/>
                <span className="text-gradient-brand">Digital Void.</span>
              </h1>
              
              <p className="mt-8 text-lg leading-8 text-gray-400 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                The next-generation static hosting platform. 
                <span className="text-white"> Zero config.</span> 
                <span className="text-white"> Infinite scale.</span> 
                <span className="text-white"> Instant global CDN.</span>
              </p>
              
              <div className="mt-12 flex items-center justify-center gap-x-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:bg-gray-200 hover:scale-105"
                >
                  <span className="relative z-10">Start Hosting Free</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
                <Link href="#features" className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors">
                  Explore Features <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Stats / Social Proof */}
              <div className="mt-20 border-t border-white/5 pt-10 grid grid-cols-2 gap-8 md:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                 {[
                    { label: "Uptime", value: "99.9%" },
                    { label: "Deploy Time", value: "< 2s" },
                    { label: "Global Edge", value: "200+" },
                    { label: "Support", value: "24/7" },
                 ].map((stat) => (
                    <div key={stat.label} className="flex flex-col">
                        <dt className="text-sm leading-6 text-gray-500">{stat.label}</dt>
                        <dd className="order-first text-3xl font-display font-semibold tracking-tight text-white">{stat.value}</dd>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 relative">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Engineered for <span className="text-gradient-brand">Performance</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                We've stripped away the bloat. What remains is pure speed and security.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, idx) => (
                <div 
                  key={feature.name} 
                  className="glass glass-hover p-8 rounded-3xl group"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-primary group-hover:text-white group-hover:bg-primary transition-all duration-300">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-white mb-3 group-hover:text-primary transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 sm:py-32 relative">
          {/* Decorative background for pricing */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>

          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Transparent <span className="text-primary">Pricing</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Start small, scale infinitely. No hidden costs.
              </p>
            </div>
            
            <div className="mx-auto grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {plans.map((plan, idx) => {
                 const isPro = plan.name.toLowerCase().includes("pro");
                 const isBusiness = plan.name.toLowerCase().includes("business");
                 const accentColor = isBusiness ? "text-secondary" : isPro ? "text-primary" : "text-white";
                 
                 return (
                  <div
                    key={plan.id}
                    className={`glass glass-hover flex flex-col justify-between rounded-3xl p-8 xl:p-10 ${isPro ? 'border-primary/30 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : ''}`}
                    style={{ animationDelay: `${0.2 + (idx * 0.1)}s` }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-x-4">
                        <h3 className={`text-xl font-display font-bold leading-8 ${accentColor}`}>{plan.name}</h3>
                        {isPro && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary ring-1 ring-inset ring-primary/20">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-400">{plan.description}</p>
                      <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-5xl font-display font-bold tracking-tight text-white">₹{plan.price}</span>
                        <span className="text-sm font-semibold leading-6 text-gray-500">/{plan.duration} days</span>
                      </p>
                      <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                        <li className="flex gap-x-3">
                          <Check className={`h-6 w-5 flex-none ${accentColor}`} />
                          Static Website Hosting
                        </li>
                        <li className="flex gap-x-3">
                          <Check className={`h-6 w-5 flex-none ${accentColor}`} />
                          Free SSL Certificate
                        </li>
                        <li className="flex gap-x-3">
                          <Check className={`h-6 w-5 flex-none ${accentColor}`} />
                          DDoS Protection
                        </li>
                        {isPro && (
                           <li className="flex gap-x-3">
                           <Check className={`h-6 w-5 flex-none ${accentColor}`} />
                           Priority Support
                         </li>
                        )}
                         {isBusiness && (
                           <li className="flex gap-x-3">
                           <Check className={`h-6 w-5 flex-none ${accentColor}`} />
                           Custom Domains
                         </li>
                        )}
                      </ul>
                    </div>
                    <Link
                      href="/register"
                      className={`mt-8 block rounded-xl px-3 py-3 text-center text-sm font-bold leading-6 shadow-sm transition-all duration-300 ${
                        isPro 
                        ? 'bg-primary text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]' 
                        : 'bg-white/10 text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      Get started
                    </Link>
                  </div>
                 );
              })}
              {plans.length === 0 && (
                <div className="col-span-full text-center py-10">
                   <p className="text-gray-500">No plans available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 backdrop-blur-lg py-12 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-display font-bold text-gray-300">HostMyService</span>
            </div>
            <div className="flex gap-8">
                <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms</a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy</a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Status</a>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} HostMyService.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    name: 'Lightning Fast',
    description: 'Deploy globally distributed static sites with low latency and high performance. Powered by our custom edge network.',
    icon: Zap,
  },
  {
    name: 'Secure by Default',
    description: 'Automatic SSL certificates, DDoS protection, and isolated build environments for every deployment.',
    icon: Lock,
  },
  {
    name: 'Custom Domains',
    description: 'Connect your own domain names easily with our automated DNS configuration and verification.',
    icon: Globe,
  },
  {
    name: 'Instant Rollbacks',
    description: 'Every deploy is immutable. Roll back to any previous version in a single click.',
    icon: Code,
  },
  {
    name: 'Smart Compression',
    description: 'Assets are automatically optimized and compressed with Brotli/Gzip for maximum speed.',
    icon: Cpu,
  },
  {
    name: 'Enterprise Grade',
    description: '99.9% uptime SLA, 24/7 support, and dedicated infrastructure options available.',
    icon: Shield,
  },
];
