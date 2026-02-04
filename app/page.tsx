import Link from "next/link";
import { ArrowRight, Check, Server, Zap, Globe, Lock } from "lucide-react";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Plan } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  let plans: Plan[] = [];
  try {
    plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch plans from database", { error });
    // Fallback to mock data for better UX when DB is not ready or fails
    plans = [
        { id: "basic", name: "Basic", price: 0, duration: 30, description: "Perfect for personal projects", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "pro", name: "Pro", price: 499, duration: 30, description: "For professional developers", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "business", name: "Business", price: 999, duration: 30, description: "For high-traffic sites", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
  }

  if (plans.length === 0) {
      // If DB connects but has no plans, show mock plans too
      plans = [
        { id: "basic", name: "Basic", price: 0, duration: 30, description: "Perfect for personal projects", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "pro", name: "Pro", price: 499, duration: 30, description: "For professional developers", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: "business", name: "Business", price: 999, duration: 30, description: "For high-traffic sites", isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">HostMyService</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </nav>
          <div className="md:hidden">
            {/* Mobile menu button could go here */}
            <Link
              href="/login"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Deploy your static sites <span className="text-indigo-600">in seconds</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                The fastest way to host your static websites. Free SSL, DDoS protection, and global CDN included with every plan. No hidden fees.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Start Hosting for Free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to host securely
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                We handle the infrastructure so you can focus on building great websites.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <dt className="text-lg font-semibold leading-7 text-gray-900">
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Choose the perfect plan for your needs. Upgrade or cancel anytime.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 hover:shadow-lg transition-shadow"
                >
                  <div>
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
                    <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-gray-900">₹{plan.price}</span>
                      <span className="text-sm font-semibold leading-6 text-gray-600">/{plan.duration} days</span>
                    </p>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                      <li className="flex gap-x-3">
                        <Check className="h-6 w-5 flex-none text-indigo-600" />
                        Static Website Hosting
                      </li>
                      <li className="flex gap-x-3">
                        <Check className="h-6 w-5 flex-none text-indigo-600" />
                        Free SSL Certificate
                      </li>
                      <li className="flex gap-x-3">
                        <Check className="h-6 w-5 flex-none text-indigo-600" />
                        DDoS Protection
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/register"
                    className="mt-8 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Get started
                  </Link>
                </div>
              ))}
              {plans.length === 0 && (
                <div className="col-span-full text-center py-10">
                   <p className="text-gray-500">No plans available at the moment. Please check back later.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-indigo-400" />
              <span className="text-xl font-bold text-white">HostMyService</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} HostMyService. All rights reserved.
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
    description: 'Deploy globally distributed static sites with low latency and high performance.',
    icon: Zap,
  },
  {
    name: 'Secure by Default',
    description: 'Automatic SSL certificates and DDoS protection for every deployment.',
    icon: Lock,
  },
  {
    name: 'Custom Domains',
    description: 'Connect your own domain names easily with our automated DNS configuration.',
    icon: Globe,
  },
];
