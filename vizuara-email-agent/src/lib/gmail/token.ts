import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getGmailAccessToken(): Promise<{
  token: string;
  userId: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get("gmail_access_token")?.value;

  if (!token) return null;

  return { token, userId: user.id };
}
