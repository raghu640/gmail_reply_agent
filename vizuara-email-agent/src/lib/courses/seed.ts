import { createAdminClient } from "@/lib/supabase/admin";
import { parseCoursesCsv, buildCourseContent, type CourseRow } from "./parse-csv";
import { embedTexts } from "./embeddings";

const INSERT_BATCH_SIZE = 25;

interface SeedResult {
  readonly totalCourses: number;
  readonly inserted: number;
  readonly skipped: number;
  readonly errors: readonly string[];
}

/**
 * Seed course embeddings into Supabase.
 * Skips courses that already exist (by course_name).
 */
export async function seedCourseEmbeddings(
  csvPath?: string
): Promise<SeedResult> {
  const supabase = createAdminClient();
  const courses = parseCoursesCsv(csvPath);
  const errors: string[] = [];

  // Check which courses already exist
  const { data: existing } = await supabase
    .from("course_embeddings")
    .select("course_name");

  const existingNames = new Set(
    (existing ?? []).map((row) => row.course_name)
  );

  const newCourses = courses.filter(
    (c) => !existingNames.has(c.courseName)
  );

  if (newCourses.length === 0) {
    return {
      totalCourses: courses.length,
      inserted: 0,
      skipped: courses.length,
      errors: [],
    };
  }

  // Build content strings for embedding
  const contentStrings = newCourses.map(buildCourseContent);

  // Generate embeddings in batches
  const embeddings = await embedTexts(contentStrings);

  // Insert into Supabase in batches
  let inserted = 0;
  for (let i = 0; i < newCourses.length; i += INSERT_BATCH_SIZE) {
    const batch = newCourses.slice(i, i + INSERT_BATCH_SIZE);
    const rows = batch.map((course: CourseRow, idx: number) => ({
      course_name: course.courseName,
      course_link: course.courseLink,
      content: contentStrings[i + idx],
      embedding: JSON.stringify(Array.from(embeddings[i + idx])),
      metadata: {
        price: course.price,
        starting_date: course.startingDate,
        format: course.format,
        lessons: course.lessons,
        duration_hours: course.durationHours,
        audience: course.audience,
      },
    }));

    const { error } = await supabase
      .from("course_embeddings")
      .insert(rows);

    if (error) {
      errors.push(`Batch ${i / INSERT_BATCH_SIZE + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return {
    totalCourses: courses.length,
    inserted,
    skipped: existingNames.size,
    errors,
  };
}
