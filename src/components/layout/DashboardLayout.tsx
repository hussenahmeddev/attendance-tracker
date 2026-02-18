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
  userSection?: string;
  pageTitle?: string;
  pageDescription?: string;
}

import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";

export function DashboardLayout({
  children,
  role,
  userName,
  userEmail,
  userSection,
  pageTitle,
  pageDescription,
}: DashboardLayoutProps) {
  const { userData } = useAuth();

  // Role-based styling
  const roleStyles = {
    admin: {
      sidebar: "bg-blue-950 border-blue-900", // Unified Blue Sidebar
      indicator: "bg-blue-600"
    },
    teacher: {
      sidebar: "bg-blue-950 border-blue-900", // Unified Blue Sidebar
      indicator: "bg-blue-600"
    },
    student: {
      sidebar: "bg-blue-950 border-blue-900", // Unified Blue Sidebar
      indicator: "bg-blue-600"
    }
  };

  const currentStyle = roleStyles[role] || roleStyles.student;

  // Use auth context data as fallback
  const displayName = userName || userData?.displayName || "User";
  const email = userEmail || userData?.email || "";
  const section = userSection || userData?.section || "";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <ChangePasswordDialog />
      <DashboardSidebar
        role={role}
        userName={displayName}
        userEmail={email}
        userSection={section}
        className={`${currentStyle.sidebar} text-white`}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-1.5 h-6 rounded-full ${currentStyle.indicator} mr-2`} />
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
