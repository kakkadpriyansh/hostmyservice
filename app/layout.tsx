import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const unbounded = Unbounded({ 
  subsets: ["latin"], 
  variable: "--font-unbounded",
  display: "swap",
});

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HostMyService",
  description: "Static website hosting and development services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${unbounded.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
