import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!hasSupabaseConfig() || !code) return NextResponse.redirect(new URL("/masuk?error=verification", request.url));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/masuk?error=verification", request.url));
  const next = request.nextUrl.searchParams.get("next");
  if (next === "/auth/reset-password") {
    return NextResponse.redirect(new URL("/auth/reset-password", request.url));
  }
  const { data: { user } } = await supabase.auth.getUser();
  const requestedPackage = user?.user_metadata?.requested_package;
  const destination = typeof requestedPackage === "string" && /^[a-z0-9-]{1,80}$/.test(requestedPackage)
    ? `/dashboard/daftar?paket=${encodeURIComponent(requestedPackage)}`
    : "/dashboard";
  return NextResponse.redirect(new URL(destination, request.url));
}
