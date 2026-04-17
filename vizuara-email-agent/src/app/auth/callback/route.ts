import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;

      const response = NextResponse.redirect(redirectUrl);

      // Store the Google provider_token in a secure httpOnly cookie
      // so we can use it for Gmail API calls in server-side routes
      if (data.session?.provider_token) {
        response.cookies.set("gmail_access_token", data.session.provider_token, {
          httpOnly: true,
          secure: !isLocalEnv,
          sameSite: "lax",
          path: "/",
          // Google access tokens expire in 1 hour
          maxAge: 3600,
        });
      }

      return response;
    }
  }

  // OAuth error — redirect to login with error
  return NextResponse.redirect(`${origin}?error=auth_failed`);
}
