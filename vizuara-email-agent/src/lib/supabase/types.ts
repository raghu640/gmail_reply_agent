export interface Email {
  id: string;
  user_id: string;
  gmail_message_id: string;
  thread_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body: string;
  received_at: string;
  created_at: string;
}

export interface Reply {
  id: string;
  email_id: string;
  user_id: string;
  ai_draft: string;
  sent_body: string | null;
  status: "draft" | "sent";
  sent_at: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  reply_id: string;
  user_id: string;
  star_rating: number;
  text_feedback: string | null;
  created_at: string;
}

export interface CourseEmbedding {
  id: string;
  course_name: string;
  course_link: string;
  content: string;
  metadata: {
    price: string;
    starting_date: string;
    format: string;
    lessons: number;
    duration_hours: number;
    audience: string;
  };
  created_at: string;
}

export interface MatchedCourse {
  id: string;
  course_name: string;
  course_link: string;
  content: string;
  metadata: CourseEmbedding["metadata"];
  similarity: number;
}
