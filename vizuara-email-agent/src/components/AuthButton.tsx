"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
      },
    });
  };

  return (
    <Button onClick={handleLogin} size="lg" className="gap-2">
      <LogIn className="h-5 w-5" />
      Sign in with Google
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <Button variant="ghost" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  );
}
