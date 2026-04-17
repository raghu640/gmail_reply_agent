"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, RefreshCw, AlertCircle, Mail } from "lucide-react";
import type { GmailMessage } from "@/lib/gmail/client";

interface EmailListProps {
  onSelectEmail: (email: GmailMessage) => void;
  selectedEmailId: string | null;
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

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function EmailList({ onSelectEmail, selectedEmailId }: EmailListProps) {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gmail/messages");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to fetch emails");
      }

      setEmails(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
          </CardTitle>
          <CardDescription>
            {emails.length > 0
              ? `${emails.length} emails from your primary inbox`
              : "Your primary inbox emails"}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEmails}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && emails.length === 0 && (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-3 animate-pulse">
                <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchEmails}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            No emails found
          </div>
        )}

        {!error && emails.length > 0 && (
          <div className="divide-y">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 rounded-md ${
                  selectedEmailId === email.id ? "bg-muted" : ""
                }`}
              >
                <Avatar size="default" className="mt-0.5 shrink-0">
                  <AvatarFallback>{getInitials(email.fromName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {email.fromName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-foreground/80">
                    {email.subject || "(no subject)"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {email.snippet}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
