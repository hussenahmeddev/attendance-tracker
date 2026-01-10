import { DashboardSidebar } from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

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
  userName,
  userEmail,
  pageTitle,
  pageDescription,
}: DashboardLayoutProps) {
  const { userData } = useAuth();

  // Role-based styling
  const roleStyles = {
    admin: {
      bg: "bg-red-50/30",
      border: "border-red-200",
      indicator: "bg-red-500"
    },
    teacher: {
      bg: "bg-blue-50/30",
      border: "border-blue-200",
      indicator: "bg-blue-500"
    },
    student: {
      bg: "bg-green-50/30",
      border: "border-green-200",
      indicator: "bg-green-500"
    }
  };

  const currentStyle = roleStyles[role] || roleStyles.student;

  // Use auth context data as fallback
  const displayName = userName || userData?.displayName || "User";
  const email = userEmail || userData?.email || "";



  return (
    <div className={`min-h-screen flex ${currentStyle.bg}`}>
      <DashboardSidebar
        role={role}
        userName={displayName}
        userEmail={email}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b ${currentStyle.border} bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-8 rounded-full ${currentStyle.indicator} mr-2`} />
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
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">

          {children}
        </main>
      </div>
    </div>
  );
}
