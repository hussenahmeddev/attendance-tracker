import { DashboardSidebar } from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRole = "admin" | "teacher" | "student";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName?: string;
  userEmail?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export function DashboardLayout({
  children,
  role,
  userName = "John Doe",
  userEmail = "john@example.com",
  pageTitle,
  pageDescription,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} userName={userName} userEmail={userEmail} />
      
      <div className="pl-64 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center gap-4">
            {pageTitle && (
              <div>
                <h1 className="text-xl font-semibold">{pageTitle}</h1>
                {pageDescription && (
                  <p className="text-sm text-muted-foreground">{pageDescription}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-64 pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
