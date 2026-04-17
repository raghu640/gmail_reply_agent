"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle, RefreshCw } from "lucide-react";

interface FeedbackFormProps {
  replyId: string;
  onSubmitted: () => void;
}

export function FeedbackForm({ replyId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [textFeedback, setTextFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyId,
          starRating: rating,
          textFeedback: textFeedback.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit feedback");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Thanks for your feedback!</p>
            <p className="text-sm text-muted-foreground">
              You rated this draft {rating}/5 star{rating !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onSubmitted}>
            Back to Inbox
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How was the AI draft?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={submitting}
                className="rounded p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 self-center text-sm text-muted-foreground">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Text feedback */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Feedback <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={textFeedback}
            onChange={(e) => setTextFeedback(e.target.value)}
            disabled={submitting}
            rows={3}
            placeholder="What could be improved about the AI draft?"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="gap-2"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : null}
            Submit Feedback
          </Button>
          <Button variant="ghost" onClick={onSubmitted} disabled={submitting}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
