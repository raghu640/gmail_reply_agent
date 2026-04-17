import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "./embeddings";
import type { MatchedCourse } from "@/lib/supabase/types";

interface RagOptions {
  readonly matchThreshold?: number;
  readonly matchCount?: number;
}

/**
 * Retrieve the most relevant courses for a given query text.
 * Uses OpenAI embeddings + Supabase pgvector similarity search.
 */
export async function retrieveRelevantCourses(
  query: string,
  options: RagOptions = {}
): Promise<readonly MatchedCourse[]> {
  const { matchThreshold = 0.3, matchCount = 5 } = options;

  // Embed the query
  const queryEmbedding = await embedText(query);

  // Call the match_courses Supabase function
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_courses", {
    query_embedding: JSON.stringify(Array.from(queryEmbedding)),
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Similarity search failed: ${error.message}`);
  }

  return (data ?? []) as MatchedCourse[];
}

/**
 * Format matched courses into a context string for the LLM prompt.
 */
export function formatCoursesForPrompt(
  courses: readonly MatchedCourse[]
): string {
  if (courses.length === 0) {
    return "No relevant courses found in the knowledge base.";
  }

  return courses
    .map((course, i) => {
      const meta = course.metadata;
      return [
        `[Course ${i + 1}] ${course.course_name}`,
        `  Link: ${course.course_link}`,
        `  Price: ${meta.price}`,
        `  Start Date: ${meta.starting_date}`,
        `  Format: ${meta.format}`,
        `  Lessons: ${meta.lessons} | Duration: ${meta.duration_hours}h`,
        `  Audience: ${meta.audience}`,
        `  Relevance: ${(course.similarity * 100).toFixed(1)}%`,
      ].join("\n");
    })
    .join("\n\n");
}
