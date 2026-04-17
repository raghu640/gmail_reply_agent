import { SignOutButton } from "@/components/AuthButton";
import { Mail } from "lucide-react";

interface NavbarProps {
  userEmail: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg hidden sm:inline">Vizuara Email Agent</span>
          <span className="font-semibold text-lg sm:hidden">Vizuara</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:inline text-sm text-muted-foreground">{userEmail}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
