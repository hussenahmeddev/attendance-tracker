import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText
} from "lucide-react";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function StudentDashboard() {
  const { userData, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || 'N/A',
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
            role: data.role || 'student',
            status: data.status || 'active',
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
          } as User;
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');

  return (
    <DashboardLayout
      role="student"
      pageTitle="Student Dashboard"
      pageDescription={`Welcome back, ${userData?.displayName || 'Student'}!`}
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <p className="text-sm text-muted-foreground">Classes Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">0%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-sm text-muted-foreground">Notifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Welcome to EduTrack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Hello <strong>{userData?.displayName}</strong>! Your student ID is <strong>{userData?.userId}</strong>.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">System Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Students:</span>
                      <span className="font-medium">{students.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Teachers:</span>
                      <span className="font-medium">{teachers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Status:</span>
                      <Badge variant={userData?.status === 'active' ? 'default' : 'secondary'}>
                        {userData?.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Check Attendance
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Leave Request
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No classes scheduled</p>
                <p className="text-sm text-muted-foreground">Classes will appear here once scheduled</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No attendance records</p>
                <p className="text-sm text-muted-foreground">Attendance data will appear once classes begin</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Account Created</p>
                  <p className="text-sm text-muted-foreground">
                    Your student account was successfully created on {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'today'}
                  </p>
                </div>
              </div>
              
              <div className="text-center py-4 text-sm text-muted-foreground">
                More activities will appear as you use the system
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}