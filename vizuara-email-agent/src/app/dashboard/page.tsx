import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, MessageSquare, Star } from "lucide-react";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { EmailInbox } from "@/components/EmailInbox";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch stats using admin client (data was inserted via service role)
  const adminClient = createAdminClient();
  const [repliesResult, feedbackResult] = await Promise.all([
    adminClient
      .from("replies")
      .select("id, status")
      .eq("user_id", user.id),
    adminClient
      .from("feedback")
      .select("star_rating")
      .eq("user_id", user.id),
  ]);

  const replies = repliesResult.data ?? [];
  const sentCount = replies.filter((r) => r.status === "sent").length;
  const draftCount = replies.filter((r) => r.status === "draft").length;

  const ratings = feedbackResult.data ?? [];
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, f) => sum + f.star_rating, 0) / ratings.length).toFixed(1)
    : "--";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userEmail={user.email ?? ""} />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata?.full_name ?? user.email}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Inbox Emails</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{draftCount}</div>
                <CardDescription>Pending replies</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Replies Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sentCount}</div>
                <CardDescription>Total replies</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgRating}</div>
                <CardDescription>AI draft quality</CardDescription>
              </CardContent>
            </Card>
          </div>

          <EmailInbox />

          <KnowledgeBase />
        </div>
      </main>
    </div>
  );
}
