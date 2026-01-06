import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { userData, loading } = useAuth();

  console.log('AdminDashboard - userData:', userData);
  console.log('AdminDashboard - loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Admin Dashboard"
      pageDescription="Welcome back, Administrator"
    >
      <div className="space-y-6">
        {/* User Profile */}
        <UserProfile />

        {/* Dashboard Content */}
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Dashboard Content</h2>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard! From here you can manage classes, users, and view reports.
          </p>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-primary font-medium">Select an option from the menu or quick actions below.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}