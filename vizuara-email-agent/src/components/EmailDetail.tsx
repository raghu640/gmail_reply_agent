"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Send,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";
import type { GmailMessage } from "@/lib/gmail/client";
import type { ReplyTone } from "@/lib/gmail/generate-reply";

interface EmailDetailProps {
  email: GmailMessage;
  onBack: () => void;
  onSent: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatFullDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const TONE_OPTIONS: { value: ReplyTone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Formal and structured" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational" },
  { value: "concise", label: "Concise", description: "Brief and direct" },
];

export function EmailDetail({ email, onBack, onSent }: EmailDetailProps) {
  const [tone, setTone] = useState<ReplyTone>("professional");
  const [draft, setDraft] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coursesUsed, setCoursesUsed] = useState<number | null>(null);
  const [fullContext, setFullContext] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/gmail/reply/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailBody: email.body || email.snippet,
          emailSubject: email.subject,
          senderName: email.fromName,
          tone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate reply");
      }

      setDraft(data.draft);
      setAiDraft(data.draft);
      setCoursesUsed(data.coursesUsed);
      setFullContext(data.fullContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reply");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/gmail/reply/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmailMessageId: email.id,
          threadId: email.threadId,
          to: email.from,
          subject: email.subject,
          fromEmail: email.from,
          fromName: email.fromName,
          emailBody: email.body || email.snippet,
          receivedAt: email.date,
          aiDraft,
          sentBody: draft,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send reply");
      }

      setSent(true);
      setReplyId(data.replyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email content */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div>
            <CardTitle className="text-lg">
              {email.subject || "(no subject)"}
            </CardTitle>
          </div>

          <div className="flex items-start gap-3">
            <Avatar size="default">
              <AvatarFallback>{getInitials(email.fromName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{email.fromName}</span>
                <Badge variant="secondary" className="text-xs">
                  {email.from}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatFullDate(email.date)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
            {email.body || email.snippet}
          </div>
        </CardContent>
      </Card>

      {/* Reply section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            AI Reply
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tone selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  disabled={generating || sending || sent}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    tone === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {!sent && (
            <Button
              onClick={handleGenerate}
              disabled={generating || sending}
              className="gap-2"
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {draft ? "Regenerate Draft" : "Generate Draft"}
            </Button>
          )}

          {/* Course context info */}
          {coursesUsed !== null && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Used {coursesUsed} course{coursesUsed !== 1 ? "s" : ""} from knowledge base for context
              </p>
              {fullContext && (
                <div>
                  <button
                    onClick={() => setShowContext((prev) => !prev)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {showContext ? "Hide full LLM context" : "View full LLM context"}
                  </button>
                  {showContext && (
                    <div className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed font-mono">
                      {fullContext}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editable draft */}
          {draft && !sent && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">Draft Reply (edit before sending)</label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                  rows={12}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="gap-2"
                  variant="default"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Approve & Send
                </Button>
                <span className="text-xs text-muted-foreground">
                  Replying to {email.from}
                </span>
              </div>
            </>
          )}

          {/* Sent confirmation */}
          {sent && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Reply sent successfully</p>
                <p className="text-sm opacity-80">
                  Sent to {email.from} — both the AI draft and your final version have been saved.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback form - shown after successful send */}
      {sent && replyId && (
        <FeedbackForm replyId={replyId} onSubmitted={onSent} />
      )}
    </div>
  );
}
