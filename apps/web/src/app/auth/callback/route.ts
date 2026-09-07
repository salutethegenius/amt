import { createClient } from "@/lib/supabase/server";
import { postLoginPath, safeNextPath } from "@/lib/auth/safe-next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next")) ?? "/portal";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).single()
        : { data: null };
      const dest = next === "/reset-password" ? next : postLoginPath(profile?.role, next);
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
