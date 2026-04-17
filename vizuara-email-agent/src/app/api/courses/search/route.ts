import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrieveRelevantCourses } from "@/lib/courses/rag";

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const query = body.query;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'query' field" },
      { status: 400 }
    );
  }

  try {
    const courses = await retrieveRelevantCourses(query, {
      matchThreshold: body.threshold ?? 0.3,
      matchCount: body.count ?? 5,
    });
    return NextResponse.json({ courses });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
