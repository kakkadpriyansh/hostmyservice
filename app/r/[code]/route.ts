import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AFFILIATE_CODE_REGEX, REFERRAL_COOKIE, getAffiliateSettings } from "@/lib/affiliate";

/**
 * Referral link: /r/<code>
 * Remembers the affiliate in a cookie for `cookieDays`, then sends the visitor
 * to the home page. The referral is attributed when they register.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const home = new URL("/", req.url);
  const response = NextResponse.redirect(home);

  if (!AFFILIATE_CODE_REGEX.test(code)) return response;

  const settings = await getAffiliateSettings();
  if (!settings.programEnabled) return response;

  const affiliate = await prisma.affiliate.findUnique({ where: { code }, select: { id: true, status: true } });
  if (!affiliate || affiliate.status !== "APPROVED") return response;

  await prisma.affiliate.update({ where: { id: affiliate.id }, data: { clickCount: { increment: 1 } } });

  // First click wins: don't overwrite an existing referral cookie
  if (!req.cookies.get(REFERRAL_COOKIE)) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: settings.cookieDays * 24 * 60 * 60,
    });
  }
  return response;
}
