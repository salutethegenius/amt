import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { postLoginPath } from "@/lib/auth/safe-next";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (path.startsWith("/dashboard") || path.startsWith("/portal")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (path.startsWith("/dashboard") || path.startsWith("/portal")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (path.startsWith("/dashboard")) {
      if (!profile || profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/portal";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    if (path.startsWith("/portal") && profile?.role === "admin") {
      const invoiceMatch = path.match(/^\/portal\/invoices\/([^/]+)$/);
      const url = request.nextUrl.clone();
      url.search = "";
      url.pathname = invoiceMatch
        ? `/dashboard/invoices/${invoiceMatch[1]}`
        : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if ((path === "/login" || path === "/signup") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = postLoginPath(profile?.role, request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(url);
  }

  if (path === "/reset-password" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/portal",
    "/portal/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
