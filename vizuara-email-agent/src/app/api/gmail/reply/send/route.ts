import { NextResponse } from "next/server";
import { getGmailAccessToken } from "@/lib/gmail/token";
import { sendReply } from "@/lib/gmail/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await getGmailAccessToken();

  if (!auth) {
    return NextResponse.json(
      { error: "Not authenticated or missing Gmail access" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const {
    gmailMessageId,
    threadId,
    to,
    subject,
    fromEmail,
    fromName,
    emailBody,
    receivedAt,
    aiDraft,
    sentBody,
  } = body;

  if (!gmailMessageId || !threadId || !to || !subject || !sentBody || !aiDraft) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // 1. Send the reply via Gmail API
    await sendReply(auth.token, to, subject, sentBody, threadId, gmailMessageId);

    // 2. Store the email reference in Supabase (only on send)
    const supabase = createAdminClient();

    const { data: emailRow, error: emailError } = await supabase
      .from("emails")
      .upsert(
        {
          user_id: auth.userId,
          gmail_message_id: gmailMessageId,
          thread_id: threadId,
          from_email: fromEmail,
          from_name: fromName,
          subject,
          body: emailBody,
          received_at: receivedAt
            ? new Date(receivedAt).toISOString()
            : new Date().toISOString(),
        },
        { onConflict: "gmail_message_id" }
      )
      .select("id")
      .single();

    if (emailError) {
      throw new Error(`Failed to store email: ${emailError.message}`);
    }

    // 3. Store the reply with both AI draft and sent version
    const { data: replyRow, error: replyError } = await supabase
      .from("replies")
      .insert({
        email_id: emailRow.id,
        user_id: auth.userId,
        ai_draft: aiDraft,
        sent_body: sentBody,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (replyError) {
      throw new Error(`Failed to store reply: ${replyError.message}`);
    }

    return NextResponse.json({
      success: true,
      replyId: replyRow.id,
      emailId: emailRow.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
