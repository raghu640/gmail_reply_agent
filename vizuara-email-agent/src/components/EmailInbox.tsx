"use client";

import { useState } from "react";
import { EmailList } from "@/components/EmailList";
import { EmailDetail } from "@/components/EmailDetail";
import type { GmailMessage } from "@/lib/gmail/client";

export function EmailInbox() {
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);

  if (selectedEmail) {
    return (
      <EmailDetail
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onSent={() => setSelectedEmail(null)}
      />
    );
  }

  return (
    <EmailList
      onSelectEmail={setSelectedEmail}
      selectedEmailId={null}
    />
  );
}
