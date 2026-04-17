import { NextResponse } from "next/server";
import { getGmailAccessToken } from "@/lib/gmail/token";
import { fetchMessageById } from "@/lib/gmail/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getGmailAccessToken();

  if (!auth) {
    return NextResponse.json(
      { error: "Not authenticated or missing Gmail access" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const message = await fetchMessageById(auth.token, id);
    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch email";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
