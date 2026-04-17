const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  body: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailMessagePart[];
}

interface GmailRawMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: GmailHeader[];
    mimeType: string;
    body: { data?: string; size: number };
    parts?: GmailMessagePart[];
  };
}

function getHeader(headers: GmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
  }
  return { name: from, email: from };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractTextBody(payload: GmailRawMessage["payload"]): string {
  if (payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (!payload.parts) return "";

  const plainPart = findPart(payload.parts, "text/plain");
  if (plainPart?.body.data) {
    return decodeBase64Url(plainPart.body.data);
  }

  const htmlPart = findPart(payload.parts, "text/html");
  if (htmlPart?.body.data) {
    return decodeBase64Url(htmlPart.body.data);
  }

  return "";
}

function findPart(parts: GmailMessagePart[], mimeType: string): GmailMessagePart | undefined {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPart(part.parts, mimeType);
      if (found) return found;
    }
  }
  return undefined;
}

function parseGmailMessage(raw: GmailRawMessage): GmailMessage {
  const headers = raw.payload.headers;
  const from = getHeader(headers, "From");
  const parsed = parseFrom(from);

  return {
    id: raw.id,
    threadId: raw.threadId,
    snippet: raw.snippet,
    from: parsed.email,
    fromName: parsed.name,
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    body: extractTextBody(raw.payload),
  };
}

export async function fetchInboxMessages(
  accessToken: string,
  maxResults: number = 20
): Promise<GmailMessage[]> {
  const listRes = await fetch(
    `${GMAIL_API_BASE}/messages?maxResults=${maxResults}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listRes.ok) {
    const error = await listRes.text();
    throw new Error(`Gmail API list error (${listRes.status}): ${error}`);
  }

  const listData = await listRes.json();
  const messageIds: { id: string }[] = listData.messages ?? [];

  if (messageIds.length === 0) return [];

  const messages = await Promise.all(
    messageIds.map((msg) => fetchMessageById(accessToken, msg.id))
  );

  return messages;
}

function encodeBase64Url(str: string): string {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendReply(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId: string,
  messageId: string
): Promise<{ id: string; threadId: string }> {
  const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${messageId}`,
    `References: ${messageId}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    body,
  ].join("\r\n");

  const encodedMessage = encodeBase64Url(rawMessage);

  const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedMessage,
      threadId,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gmail API send error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function fetchMessageById(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const res = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Gmail API get error (${res.status}): ${error}`);
  }

  const raw: GmailRawMessage = await res.json();
  return parseGmailMessage(raw);
}
