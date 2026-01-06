import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Clock,
  UserCheck,
  Home,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

type UserRole = "admin" | "teacher" | "student";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Classes", href: "/admin/classes", icon: BookOpen },
  { title: "Attendance", href: "/admin/attendance", icon: ClipboardCheck },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Calendar", href: "/admin/calendar", icon: Calendar },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "System Utils", href: "/admin/system-utils", icon: Wrench },
];

const teacherNavItems: NavItem[] = [
  { title: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { title: "My Classes", href: "/teacher/classes", icon: BookOpen },
  { title: "Take Attendance", href: "/teacher/attendance", icon: UserCheck },
  { title: "Students", href: "/teacher/students", icon: GraduationCap },
  { title: "Reports", href: "/teacher/reports", icon: FileText },
  { title: "Schedule", href: "/teacher/schedule", icon: Clock },
];

const studentNavItems: NavItem[] = [
  { title: "Dashboard", href: "/student", icon: LayoutDashboard },
  { title: "My Attendance", href: "/student/attendance", icon: ClipboardCheck },
  { title: "Leave Request", href: "/student/leave", icon: FileText },
  { title: "Schedule", href: "/student/schedule", icon: Calendar },
  { title: "Notifications", href: "/student/notifications", icon: Bell },
];

const navItemsByRole: Record<UserRole, NavItem[]> = {
  admin: adminNavItems,
  teacher: teacherNavItems,
  student: studentNavItems,
};

interface DashboardSidebarProps {
  role: UserRole;
  userName?: string;
  userEmail?: string;
}

export function DashboardSidebar({ role, userName = "User", userEmail = "" }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navItemsByRole[role];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    admin: "Administrator",
    teacher: "Teacher",
    student: "Student",
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">
              EduTrack
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "absolute -right-3 top-6 rounded-full bg-sidebar border border-sidebar-border"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {roleLabels[role]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          )}
        >
          <Home className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Home</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
