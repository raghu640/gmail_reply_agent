import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { replyId, starRating, textFeedback } = body;

  if (!replyId || !starRating || starRating < 1 || starRating > 5) {
    return NextResponse.json(
      { error: "Missing replyId or invalid starRating (1-5)" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("feedback")
      .insert({
        reply_id: replyId,
        user_id: user.id,
        star_rating: starRating,
        text_feedback: textFeedback || null,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to store feedback: ${error.message}`);
    }

    return NextResponse.json({ success: true, feedbackId: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to store feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
