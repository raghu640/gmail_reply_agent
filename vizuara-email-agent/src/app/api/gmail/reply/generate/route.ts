import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReplyDraft, type ReplyTone } from "@/lib/gmail/generate-reply";

const VALID_TONES: ReplyTone[] = ["professional", "friendly", "concise"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { emailBody, emailSubject, senderName, tone } = body;

  if (!emailBody || !emailSubject || !senderName) {
    return NextResponse.json(
      { error: "Missing required fields: emailBody, emailSubject, senderName" },
      { status: 400 }
    );
  }

  const selectedTone: ReplyTone = VALID_TONES.includes(tone) ? tone : "professional";

  try {
    const result = await generateReplyDraft(emailBody, emailSubject, senderName, selectedTone, user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
