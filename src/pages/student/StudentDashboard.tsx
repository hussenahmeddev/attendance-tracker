import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEnrolledClassesForStudent, type Class } from "@/lib/classUtils";
import { calculateStudentAttendanceSummary } from "@/lib/attendanceUtils";
import { DEFAULT_VALUES } from "@/config/constants";
import { subscribeToCalendarEvents, type CalendarEvent } from "@/lib/eventUtils";
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
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
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
  const [classesToday, setClassesToday] = useState<Class[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({
    classesToday: 0,
    attendanceRate: 0,
    totalClasses: 0,
    pendingRequests: 0
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch student data and statistics
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.userId) return;

      try {
        // Fetch users for system status
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId || 'N/A',
          displayName: doc.data().displayName || 'Unknown',
          email: doc.data().email || 'No email',
          role: doc.data().role || 'student',
          status: doc.data().status || 'active',
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : 'Unknown'
        } as User));
        setUsers(usersData);

        // Fetch enrolled classes
        const classes = await getEnrolledClassesForStudent(userData.userId);
        setEnrolledClasses(classes);

        // Calculate classes today
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
        const todayClasses = classes.filter(cls =>
          cls.schedule && cls.schedule.toLowerCase().includes(today.toLowerCase().substring(0, 3))
        );
        setClassesToday(todayClasses);

        // Fetch attendance stats
        try {
          const summary = await calculateStudentAttendanceSummary(userData.userId);

          setStudentStats({
            classesToday: todayClasses.length,
            attendanceRate: summary.attendancePercentage,
            totalClasses: classes.length, // Use actual count of enrolled classes
            pendingRequests: DEFAULT_VALUES.PENDING_REQUESTS // Keep default for now
          });
        } catch (error) {
          console.error('Error fetching attendance summary:', error);
          setStudentStats({
            classesToday: todayClasses.length,
            attendanceRate: 0,
            totalClasses: classes.length,
            pendingRequests: 0
          });
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    const unsubscribeEvents = subscribeToCalendarEvents((data) => {
      setEvents(data.filter(e => new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0)));
      setEventsLoading(false);
    });

    fetchData();
    return () => unsubscribeEvents();
  }, [userData]);

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
      pageDescription={`My Learning Portal & Progress - ${userData?.displayName || 'Student'}`}
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{studentStats.totalClasses}</div>
              <p className="text-sm text-muted-foreground">Enrolled Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{studentStats.attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{studentStats.classesToday}</div>
              <p className="text-sm text-muted-foreground">Classes Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{studentStats.pendingRequests}</div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
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

        {/* Today's Overview & Events */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classesToday.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No classes scheduled for today</p>
                  <p className="text-sm text-muted-foreground">Enjoy your day off!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classesToday.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-muted-foreground">{cls.schedule} • {cls.room}</div>
                      </div>
                      <Badge>{cls.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Events & Holidays
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 3).map(event => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold">{event.title}</div>
                        <Badge variant="outline" className="text-[10px] uppercase">{event.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex items-center gap-3 text-[10px] font-medium text-primary">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance & Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-3xl font-bold mb-2 text-primary">{studentStats.attendanceRate}%</div>
                <p className="text-muted-foreground">Overall Attendance</p>
                {studentStats.totalClasses === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Attendance data will appear once classes begin</p>
                )}
              </div>
            </CardContent>
          </Card>

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
      </div>
    </DashboardLayout>
  );
}