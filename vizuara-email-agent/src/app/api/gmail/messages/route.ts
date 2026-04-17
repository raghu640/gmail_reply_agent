import { NextResponse } from "next/server";
import { getGmailAccessToken } from "@/lib/gmail/token";
import { fetchInboxMessages } from "@/lib/gmail/client";

export async function GET() {
  const auth = await getGmailAccessToken();

  if (!auth) {
    return NextResponse.json(
      { error: "Not authenticated or missing Gmail access" },
      { status: 401 }
    );
  }

  try {
    const messages = await fetchInboxMessages(auth.token, 20);
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
