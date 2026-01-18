import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, FileText, Download, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_VALUES, calculateRegularAttendees, calculateNeedsAttention, STATUS_COLORS, ATTENDANCE_WEIGHTS } from "@/config/constants";
import { getAttendanceStatistics } from "@/lib/attendanceUtils";
import { useReportGenerator } from "@/hooks/useReportGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function TeacherReports() {
  const { userData } = useAuth();
  const { generateReport, isGenerating, error } = useReportGenerator();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("summary");
  const [period, setPeriod] = useState("week");
  const [weeklyStats, setWeeklyStats] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState(0);
  const [semesterStats, setSemesterStats] = useState(0);

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
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const [classStudents, setClassStudents] = useState<User[]>([]);

  // Fetch teacher's enrolled students specifically
  useEffect(() => {
    const fetchTeacherStudents = async () => {
      if (!userData?.userId) return;
      try {
        const { fetchTeacherClasses, getStudentsForClass } = await import("@/lib/classUtils");
        const teacherClasses = await fetchTeacherClasses(userData.userId);
        const studentIds = new Set<string>();
        const studentList: User[] = [];

        for (const cls of teacherClasses) {
          const enrolls = await getStudentsForClass(cls.id);
          enrolls.forEach(s => {
            if (!studentIds.has(s.userId)) {
              studentIds.add(s.userId);
              const fullUser = users.find(u => u.userId === s.userId || u.id === s.id);
              if (fullUser) studentList.push(fullUser);
              else studentList.push(s as any);
            }
          });
        }
        setClassStudents(studentList);
      } catch (err) {
        console.error("Error fetching teacher students:", err);
      }
    };
    if (users.length > 0) fetchTeacherStudents();
  }, [userData, users]);

  // Fetch real report statistics
  useEffect(() => {
    const fetchReportStats = async () => {
      if (!userData?.userId || !userData?.uid) return;

      try {
        const today = new Date();
        const toLocalYMD = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Fetch ALL attendance and filter in memory to avoid ID/timezone issues
        const { fetchAllAttendance } = await import("@/lib/attendanceUtils");
        const allAttendance = await fetchAllAttendance();

        // Filter for this teacher (either by display ID or doc ID)
        const myAttendance = allAttendance.filter(r =>
          r.teacherId === userData.userId || r.teacherId === userData.uid
        );

        // Date markers
        // This Week (Sunday start)
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        const startWeek = toLocalYMD(sunday);

        // This Month
        const startMonth = toLocalYMD(new Date(today.getFullYear(), today.getMonth(), 1));

        // This Semester
        const startSemesterDate = new Date(today);
        startSemesterDate.setMonth(today.getMonth() - 6);
        const startSemester = toLocalYMD(startSemesterDate);

        const calcRate = (records: any[]) => {
          if (records.length === 0) return 0;
          const present = records.filter(r => r.status === 'present').length;
          const late = records.filter(r => r.status === 'late').length;
          const excused = records.filter(r => r.status === 'excused').length;

          return Math.round((
            (present * ATTENDANCE_WEIGHTS.PRESENT) +
            (late * ATTENDANCE_WEIGHTS.LATE) +
            (excused * ATTENDANCE_WEIGHTS.EXCUSED)
          ) / records.length * 100);
        };

        setWeeklyStats(calcRate(myAttendance.filter(r => r.date >= startWeek)));
        setMonthlyStats(calcRate(myAttendance.filter(r => r.date >= startMonth)));
        setSemesterStats(calcRate(myAttendance.filter(r => r.date >= startSemester)));

      } catch (error) {
        console.error('Error fetching report stats:', error);
      }
    };

    fetchReportStats();
  }, [userData]);

  const displayStudents = classStudents.length > 0 ? classStudents : users.filter(u => u.role === 'student');

  // Generate reports based on real data
  const reports = [
    {
      period: "This Week",
      attendance: weeklyStats,
      trend: "up"
    },
    {
      period: "This Month",
      attendance: monthlyStats,
      trend: "up"
    },
    {
      period: "This Semester",
      attendance: semesterStats,
      trend: "up"
    }
  ];

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Reports & Analytics"
      pageDescription="View attendance reports and class analytics"
    >
      <div className="space-y-6">
        <UserProfile />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {reports.map((report, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{report.period}</p>
                            <p className="text-2xl font-bold">{report.attendance}%</p>
                          </div>
                          <div className={`p-2 rounded-full ${report.trend === "up" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}>
                            <TrendingUp className={`h-4 w-4 ${report.trend === "down" ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Generate Reports</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Report Type:</label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">Attendance Summary</SelectItem>
                          <SelectItem value="class">Class Report</SelectItem>
                          {/* <SelectItem value="student">Individual Student (Coming Soon)</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {reportType !== 'class' ? (
                        <>
                          <label className="block text-sm font-medium">Period:</label>
                          <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="semester">This Semester</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        // Class selector would go here, for now simpler implementation
                        <>
                          <label className="block text-sm font-medium">Filter:</label>
                          <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      // For teachers, we scope to their ID
                      const success = await generateReport({
                        type: reportType as any,
                        format: 'pdf', // Default to PDF for simplicity
                        dateRange: period as any,
                        role: 'teacher',
                        userId: userData?.userId,
                        title: `Teacher ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
                      });
                      if (success) {
                        toast({
                          title: "Report Generated",
                          description: "Your report has been downloaded successfully.",
                        });
                      } else {
                        toast({
                          title: "Generation Failed",
                          description: error || "Could not generate report. Try different criteria.",
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Class Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Class Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{displayStudents.length}</div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {weeklyStats >= 85 && displayStudents.length > 0 ? displayStudents.length : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Regular Attendees</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {weeklyStats < 80 && displayStudents.length > 0 ? displayStudents.length : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Need Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayStudents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No students enrolled yet. Reports will appear once students are registered.
                    </p>
                  ) : (
                    [
                      {
                        id: "1",
                        name: "Weekly Attendance Summary",
                        date: new Date().toLocaleDateString(),
                        type: "Attendance",
                        status: "completed"
                      },
                      {
                        id: "2",
                        name: "Student Performance Report",
                        date: new Date(Date.now() - 86400000).toLocaleDateString(),
                        type: "Performance",
                        status: "completed"
                      }
                    ].map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.type} • Generated on {report.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={STATUS_COLORS.COMPLETED}>Completed</Badge>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}