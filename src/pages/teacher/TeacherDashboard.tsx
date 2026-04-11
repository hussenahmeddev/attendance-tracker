import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchTeacherClasses, type Class } from "@/lib/classUtils";
import { fetchTeacherAttendance, getLocalYMD } from "@/lib/attendanceUtils";
import { subscribeToAllLeaveRequests } from "@/lib/leaveUtils";
import { ATTENDANCE_WEIGHTS } from "@/config/constants";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const { userData, loading } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    todayTotal: 0,
    overallRate: 0,
  });
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!userData?.userId) return;

    const fetchData = async () => {
      try {
        const teacherClasses = await fetchTeacherClasses(userData.userId);
        const activeClasses = teacherClasses.filter(c => c.status === 'active');
        setClasses(activeClasses);

        const today = new Date();
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const todayDay = dayNames[today.getDay()];
        const todaysSchedule = activeClasses.filter(cls =>
          cls.schedule?.toLowerCase().includes(todayDay)
        );
        setTodayClasses(todaysSchedule);

        const todayStr = getLocalYMD();
        const allRecords = await fetchTeacherAttendance(userData.userId);
        const todayRecords = allRecords.filter(r => r.date === todayStr);

        const present = todayRecords.filter(r => r.status === 'present').length;
        const absent = todayRecords.filter(r => r.status === 'absent').length;
        const late = todayRecords.filter(r => r.status === 'late').length;

        let overallRate = 0;
        if (allRecords.length > 0) {
          const totalPresent = allRecords.filter(r => r.status === 'present').length;
          const totalLate = allRecords.filter(r => r.status === 'late').length;
          const totalExcused = allRecords.filter(r => r.status === 'excused').length;
          overallRate = Math.round((
            (totalPresent * ATTENDANCE_WEIGHTS.PRESENT) +
            (totalLate * ATTENDANCE_WEIGHTS.LATE) +
            (totalExcused * ATTENDANCE_WEIGHTS.EXCUSED)
          ) / allRecords.length * 100);
        }

        setAttendanceSummary({
          todayPresent: present,
          todayAbsent: absent,
          todayLate: late,
          todayTotal: todayRecords.length,
          overallRate,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    const unsubscribe = subscribeToAllLeaveRequests((requests) => {
      setPendingLeaves(requests.filter(r => r.status === 'pending').length);
    });

    fetchData();
    return () => unsubscribe();
  }, [userData]);

  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        pageTitle="Teacher Dashboard"
        pageDescription="Overview of your classes, schedule, and attendance"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.students || 0), 0);

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Teacher Dashboard"
      pageDescription="Overview of your classes, schedule, and attendance"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Pending Leave Alert */}
        {pendingLeaves > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-bold text-yellow-900">
                    {pendingLeaves} Pending Leave Request{pendingLeaves > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700">Students are waiting for your approval</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-yellow-700 hover:bg-yellow-100"
                onClick={() => navigate('/teacher/leaves')}
              >
                Review Now <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-sm text-muted-foreground">Assigned Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceSummary.overallRate}%</p>
                  <p className="text-sm text-muted-foreground">Overall Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayClasses.length}</p>
                  <p className="text-sm text-muted-foreground">Classes Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate('/teacher/schedule')}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No classes scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cls.name}</p>
                        <p className="text-sm text-muted-foreground">{cls.subject} • {cls.room || 'No room'}</p>
                      </div>
                      <Badge variant="outline">{cls.schedule}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-5 w-5" />
                  Today's Attendance
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate('/teacher/attendance')}>
                  Take Attendance <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : attendanceSummary.todayTotal === 0 ? (
                <div className="text-center py-6">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No attendance recorded today</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/teacher/attendance')}>
                    Take Attendance Now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{attendanceSummary.todayPresent}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{attendanceSummary.todayAbsent}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.todayLate}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/teacher/attendance')}>
                <ClipboardCheck className="h-4 w-4 mr-2 shrink-0" />
                <span>Take Attendance</span>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/teacher/students')}>
                <Users className="h-4 w-4 mr-2 shrink-0" />
                <span>View Students</span>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/teacher/reports')}>
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" onClick={() => navigate('/teacher/leaves')}>
                <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                <span>Leave Requests</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
