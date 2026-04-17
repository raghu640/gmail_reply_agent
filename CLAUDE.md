# Vizuara Email Agent

## Project Overview

An AI-powered email reply agent for Gmail that helps Vizuara respond to course/program inquiries. The agent fetches emails from the primary inbox, drafts context-aware replies using RAG over a course knowledge base, and lets the user review, edit, and approve before sending. No email is ever sent automatically.

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (deployed on Vercel) |
| Backend | Next.js API routes + Railway (if standalone backend needed) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Google OAuth (via Supabase Auth) |
| Email | Gmail API (read inbox, send replies) |
| AI | OpenAI or Gemini API for reply generation |
| Vector DB | Supabase pgvector for RAG over course data |

### System Flow

```
Gmail Inbox → Fetch Emails → Select Email → RAG (query course knowledge) → AI Draft Reply
→ User Reviews/Edits → User Approves (one-click) → Send via Gmail API
→ Store original draft + sent version + feedback in Supabase
```

## Core Requirements

### 1. Gmail Integration
- Use Gmail API to fetch emails from the **primary inbox only**
- Display emails in a clean, readable list
- Support reading full email threads for context
- Send replies through Gmail API (never automatically — user must click approve)

### 2. AI Reply Drafting with RAG
- Convert `vizuara_courses_dummy_dataset_150.csv` into vector embeddings stored in Supabase pgvector
- When drafting a reply, perform RAG to retrieve relevant course/program information
- Use OpenAI or Gemini API to generate the reply, grounding it in retrieved course data
- The draft should be professional, accurate, and reference specific course details (name, price, dates, duration, link)

### 3. Human-in-the-Loop
- **Never send an email automatically**
- Display the AI-drafted reply in an editable text area
- User can modify the draft freely before sending
- Single "Approve & Send" button to dispatch the email
- Clear visual distinction between draft and sent states

### 4. Authentication & Authorization
- Google OAuth login (via Supabase Auth)
- Only the authenticated email account owner can access their inbox and send replies
- Protect all API routes — verify the user's session before any Gmail or database operation

### 5. Supabase Database Schema

#### Tables

**emails**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `gmail_message_id` (text, unique)
- `thread_id` (text)
- `from_email` (text)
- `from_name` (text)
- `subject` (text)
- `body` (text)
- `received_at` (timestamptz)
- `created_at` (timestamptz)

**replies**
- `id` (uuid, primary key)
- `email_id` (uuid, references emails)
- `user_id` (uuid, references auth.users)
- `ai_draft` (text) — the original AI-generated reply
- `sent_body` (text) — the actual reply sent (after user edits)
- `status` (text: 'draft' | 'sent')
- `sent_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**feedback**
- `id` (uuid, primary key)
- `reply_id` (uuid, references replies)
- `user_id` (uuid, references auth.users)
- `star_rating` (integer, 1-5)
- `text_feedback` (text, nullable)
- `created_at` (timestamptz)

**course_embeddings**
- `id` (uuid, primary key)
- `course_name` (text)
- `course_link` (text)
- `content` (text) — full text chunk for the course
- `embedding` (vector) — pgvector embedding
- `metadata` (jsonb) — price, start date, format, duration, audience, etc.
- `created_at` (timestamptz)

### 6. Knowledge Base / RAG Pipeline
- Source: `vizuara_courses_dummy_dataset_150.csv` (150 courses with name, link, description, price, start date, format, lessons, duration, audience)
- Embed each course as a text chunk combining all fields into a natural-language description
- Store embeddings in Supabase pgvector
- At query time: embed the incoming email, perform similarity search, retrieve top-k relevant courses
- Pass retrieved courses as context to the LLM along with the email for reply generation

### 7. Feedback System
- After sending a reply, show a feedback prompt
- Star rating (1-5 stars) for the AI draft quality
- Optional text feedback field
- Store in the `feedback` table linked to the reply

## Implementation Phases

### Phase 1: Foundation
- Project setup (Next.js, Supabase, environment config)
- Google OAuth authentication
- Supabase database schema and migrations
- Basic project structure

### Phase 2: Knowledge Base
- Parse CSV and generate embeddings
- Store in Supabase pgvector
- Build RAG retrieval function
- Test similarity search quality

### Phase 3: Gmail Integration
- Gmail API setup and OAuth scopes
- Fetch primary inbox emails
- Display email list and detail view
- Store fetched emails in Supabase

### Phase 4: AI Reply Generation
- Integrate OpenAI or Gemini API
- Build reply generation pipeline: email context + RAG results → AI draft
- Editable draft UI
- Approve & Send flow via Gmail API
- Store both AI draft and sent version

### Phase 5: Feedback & Polish
- Star rating + text feedback UI and storage
- Email thread view improvements
- Error handling and loading states
- UI polish and responsive design

### Phase 6: Deployment
- Deploy frontend to Vercel
- Deploy backend to Railway (if needed)
- Environment variables and secrets management
- Final testing end-to-end

## Development Rules

- **Phased execution**: Implement one phase at a time. Get user confirmation before moving to the next phase.
- **Ask preferences first**: Before each phase, ask the user about any choices (e.g., OpenAI vs Gemini, UI preferences, email display format).
- **No automatic sends**: The system must never send an email without explicit user approval via button click.
- **Store both drafts**: Always save the original AI draft AND the final sent version separately.
- **Security**: All API routes must verify authentication. Never expose Gmail tokens or API keys client-side.
- **Environment variables**: Store all secrets (API keys, OAuth credentials, Supabase keys) in `.env.local` — never commit them.

## CSV Knowledge Base Fields

| Field | Description |
|-------|------------|
| Course name | Name of the course |
| Course link | URL to the course page |
| Course description | Detailed description of the course |
| Price | Course price in USD |
| Starting date | Course start date |
| Whether it is live or self-paced | Course delivery format |
| Number of lessons | Total lesson count |
| Total duration in number of hours | Total hours of content |
| Who the course is meant for | Target audience |