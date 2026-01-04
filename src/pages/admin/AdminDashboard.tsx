import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        
        {/* Simple content for testing */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Dashboard Content</h2>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard! Your user ID is: {userData?.userId || 'Loading...'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}