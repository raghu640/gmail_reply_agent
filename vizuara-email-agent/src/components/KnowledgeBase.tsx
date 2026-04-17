"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Database, Search, Loader2 } from "lucide-react";

interface SeedResult {
  totalCourses: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

interface MatchedCourse {
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
  similarity: number;
}

export function KnowledgeBase() {
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MatchedCourse[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSeed() {
    setSeedLoading(true);
    setSeedError(null);
    setSeedResult(null);

    try {
      const res = await fetch("/api/courses/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSeedError(data.error ?? "Seed failed");
      } else {
        setSeedResult(data);
      }
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const res = await fetch("/api/courses/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed");
      } else {
        setSearchResults(data.courses);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Seed Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Knowledge Base
          </CardTitle>
          <CardDescription>
            Seed course data into the vector database for RAG retrieval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              "Seed Course Embeddings"
            )}
          </Button>

          {seedResult && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>Total courses: {seedResult.totalCourses}</p>
              <p>Inserted: {seedResult.inserted}</p>
              <p>Skipped (already exist): {seedResult.skipped}</p>
              {seedResult.errors.length > 0 && (
                <p className="text-destructive">
                  Errors: {seedResult.errors.join(", ")}
                </p>
              )}
            </div>
          )}

          {seedError && (
            <p className="text-sm text-destructive">{seedError}</p>
          )}
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Test Course Search
          </CardTitle>
          <CardDescription>
            Test similarity search against the knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g. I want to learn Python for data science"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" disabled={searchLoading || !searchQuery.trim()}>
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {searchError && (
            <p className="text-sm text-destructive">{searchError}</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((course, i) => (
                <div
                  key={i}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{course.course_name}</span>
                    <span className="text-muted-foreground text-xs">
                      {(course.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs flex flex-wrap gap-x-3">
                    <span>{course.metadata.price}</span>
                    <span>{course.metadata.format}</span>
                    <span>{course.metadata.lessons} lessons</span>
                    <span>{course.metadata.duration_hours}h</span>
                    <span>Starts {course.metadata.starting_date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For: {course.metadata.audience}
                  </p>
                  <a
                    href={course.course_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    View course
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
