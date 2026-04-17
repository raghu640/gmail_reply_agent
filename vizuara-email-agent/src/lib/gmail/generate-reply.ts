import OpenAI from "openai";
import { retrieveRelevantCourses, formatCoursesForPrompt } from "@/lib/courses/rag";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReplyTone = "professional" | "friendly" | "concise";

const TONE_INSTRUCTIONS: Record<ReplyTone, string> = {
  professional:
    "Use a professional, formal tone. Be polite, thorough, and structured. Address the sender respectfully.",
  friendly:
    "Use a warm, friendly tone. Be approachable and conversational while still being helpful and informative.",
  concise:
    "Be brief and to the point. Provide only the essential information in a clear, direct manner. Keep the reply short.",
};

interface PastFeedback {
  star_rating: number;
  text_feedback: string | null;
  ai_draft: string;
  sent_body: string | null;
}

async function fetchRecentFeedback(userId: string): Promise<PastFeedback[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("feedback")
    .select(`
      star_rating,
      text_feedback,
      replies:reply_id (
        ai_draft,
        sent_body
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map((f: Record<string, unknown>) => {
    const reply = f.replies as Record<string, unknown> | null;
    return {
      star_rating: f.star_rating as number,
      text_feedback: f.text_feedback as string | null,
      ai_draft: (reply?.ai_draft as string) ?? "",
      sent_body: (reply?.sent_body as string | null) ?? null,
    };
  });
}

function formatFeedbackForPrompt(feedback: PastFeedback[]): string {
  if (feedback.length === 0) return "";

  const entries = feedback.map((f, i) => {
    const lines = [
      `[Feedback ${i + 1}] Rating: ${f.star_rating}/5`,
    ];
    if (f.text_feedback) {
      lines.push(`  User comment: ${f.text_feedback}`);
    }
    if (f.sent_body && f.sent_body !== f.ai_draft) {
      lines.push(`  Note: User edited the AI draft before sending — learn from their edits.`);
      lines.push(`  Original AI draft (excerpt): ${f.ai_draft.slice(0, 200)}...`);
      lines.push(`  User's final version (excerpt): ${f.sent_body.slice(0, 200)}...`);
    }
    return lines.join("\n");
  });

  return `\n\n## Past Feedback on Your Drafts
Learn from this feedback to improve your drafts. Higher ratings mean the user liked that style. Pay special attention to low ratings and user comments.

${entries.join("\n\n")}`;
}

function buildSystemPrompt(
  courseContext: string,
  tone: ReplyTone,
  feedbackContext: string
): string {
  return `You are a helpful email assistant for Vizuara, an online education company. Your job is to draft reply emails to inquiries about courses and programs.

## Tone
${TONE_INSTRUCTIONS[tone]}

## Course Knowledge Base
Use ONLY the following course information to answer questions. If the inquiry is not about courses, respond helpfully but do not invent course details.

${courseContext}${feedbackContext}

## Rules
- Reference specific course details (name, price, dates, duration, link) when relevant
- Never invent or guess course information not provided above
- Always include the course link when recommending a course
- Sign off as "Vizuara Team"
- Do NOT include a subject line — only write the reply body`;
}

export async function generateReplyDraft(
  emailBody: string,
  emailSubject: string,
  senderName: string,
  tone: ReplyTone,
  userId: string
): Promise<{ draft: string; coursesUsed: number; fullContext: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const [courses, feedback] = await Promise.all([
    retrieveRelevantCourses(`${emailSubject} ${emailBody}`.slice(0, 500), {
      matchThreshold: 0.25,
      matchCount: 5,
    }),
    fetchRecentFeedback(userId),
  ]);

  const courseContext = formatCoursesForPrompt(courses);
  const feedbackContext = formatFeedbackForPrompt(feedback);
  const systemPrompt = buildSystemPrompt(courseContext, tone, feedbackContext);

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Draft a reply to this email.\n\nFrom: ${senderName}\nSubject: ${emailSubject}\n\n${emailBody}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const draft = completion.choices[0]?.message?.content ?? "";

  const userMessage = `Draft a reply to this email.\n\nFrom: ${senderName}\nSubject: ${emailSubject}\n\n${emailBody}`;
  const fullContext = `=== SYSTEM PROMPT ===\n\n${systemPrompt}\n\n=== USER MESSAGE ===\n\n${userMessage}`;

  return { draft, coursesUsed: courses.length, fullContext };
}
