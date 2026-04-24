import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
} from "lucide-react";

export default function AdminDashboard() {
  const { userData, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    dailyAttendanceRate: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data()).filter(u => !u.deleted);

        const totalUsers = users.length;
        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalTeachers = users.filter(u => u.role === 'teacher').length;

        // Fetch classes
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const classes = classesSnapshot.docs.map(doc => doc.data());

        // Calculate real daily attendance rate
        let dailyAttendanceRate = 0;
        
        if (totalStudents > 0) {
          // Get today's date in YYYY-MM-DD format
          const today = new Date().toISOString().split('T')[0];
          
          // Fetch today's attendance records
          const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
          const todayAttendance = attendanceSnapshot.docs
            .map(doc => doc.data())
            .filter(record => record.date === today);

          // Count unique students who were present today
          const presentStudents = new Set(
            todayAttendance
              .filter(record => record.status === 'present')
              .map(record => record.studentId)
          );

          // Calculate percentage
          dailyAttendanceRate = Math.round((presentStudents.size / totalStudents) * 100);
        }

        setStats({
          totalUsers,
          totalStudents,
          totalTeachers,
          totalClasses: classes.length,
          dailyAttendanceRate,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!loading && userData) {
      fetchDashboardData();
    }
  }, [loading, userData]);

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        pageTitle="Admin Dashboard"
        pageDescription="System Command Center & Analytics"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium text-foreground">Loading Admin Dashboard</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Admin Dashboard"
      pageDescription="System Command Center & Analytics"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* System-wide Analytics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle={`${stats.totalUsers} total users`}
            icon={GraduationCap}
            variant="success"
            trend={{ value: 5.2, isPositive: true }}
          />

          <StatsCard
            title="Total Teachers"
            value={stats.totalTeachers}
            subtitle="Active instructors"
            icon={Users}
            variant="info"
            trend={{ value: 2.1, isPositive: true }}
          />

          <StatsCard
            title="Active Classes"
            value={stats.totalClasses}
            subtitle="Running courses"
            icon={BookOpen}
            variant="default"
            trend={{ value: 8.3, isPositive: true }}
          />

          <StatsCard
            title="Daily Attendance"
            value={`${stats.dailyAttendanceRate}%`}
            subtitle="Today's rate"
            icon={TrendingUp}
            variant={stats.dailyAttendanceRate >= 80 ? "success" : "warning"}
            trend={{ value: 2.4, isPositive: true }}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users:</span>
                  <span className="font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teachers:</span>
                  <span className="font-medium">{stats.totalTeachers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classes:</span>
                  <span className="font-medium">{stats.totalClasses}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-primary">{stats.dailyAttendanceRate}%</div>
                <p className="text-sm text-muted-foreground mt-2">Daily Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use the navigation menu to:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Manage users</li>
                  <li>View classes</li>
                  <li>Check attendance</li>
                  <li>Generate reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
