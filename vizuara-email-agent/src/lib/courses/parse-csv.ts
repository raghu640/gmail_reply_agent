import { readFileSync } from "fs";
import { join } from "path";

export interface CourseRow {
  courseName: string;
  courseLink: string;
  courseDescription: string;
  price: string;
  startingDate: string;
  format: string;
  lessons: number;
  durationHours: number;
  audience: string;
}

/**
 * Parse a single CSV line, handling quoted fields with commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCoursesCsv(csvPath?: string): readonly CourseRow[] {
  const filePath =
    csvPath ?? join(process.cwd(), "data", "courses.csv");
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const fields = parseCsvLine(line);
    return {
      courseName: fields[0] ?? "",
      courseLink: fields[1] ?? "",
      courseDescription: fields[2] ?? "",
      price: fields[3] ?? "",
      startingDate: fields[4] ?? "",
      format: fields[5] ?? "",
      lessons: parseInt(fields[6] ?? "0", 10) || 0,
      durationHours: parseInt(fields[7] ?? "0", 10) || 0,
      audience: fields[8] ?? "",
    };
  });
}

/**
 * Build a natural-language text chunk for a course that will be embedded.
 */
export function buildCourseContent(course: CourseRow): string {
  return [
    `Course: ${course.courseName}`,
    `Description: ${course.courseDescription}`,
    `Price: ${course.price}`,
    `Starting Date: ${course.startingDate}`,
    `Format: ${course.format}`,
    `Number of Lessons: ${course.lessons}`,
    `Duration: ${course.durationHours} hours`,
    `Target Audience: ${course.audience}`,
    `Link: ${course.courseLink}`,
  ].join("\n");
}
