import { LoginButton } from "@/components/AuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Bot, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vizuara Email Agent</CardTitle>
          <CardDescription>
            AI-powered email replies grounded in your course catalog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Bot className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <span>Drafts context-aware replies using your course knowledge base</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Shield className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <span>You always review and approve before any email is sent</span>
            </div>
          </div>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
