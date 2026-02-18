import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Filter,
  Eye,
  Settings,
  Plus,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  LineChart,
  Target,
  TrendingDown,
  Activity,
  BookOpen,
  UserCheck,
  FileBarChart
} from "lucide-react";
import { STATUS_COLORS } from "@/config/constants";
import { useReportGenerator } from "@/hooks/useReportGenerator";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchAllClasses } from "@/lib/classUtils";
import { 
  getAttendanceStatistics, 
  getAttendanceTrends,
  calculateStudentAttendanceSummary,
  fetchAllAttendance
} from "@/lib/attendanceUtils";
import { AttendanceChart } from "@/components/attendance/AttendanceChart";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  teacherId: string;
}

interface AttendanceInsight {
  type: 'trend' | 'risk' | 'performance';
  title: string;
  description: string;
  value: string;
  change: number;
  severity: 'low' | 'medium' | 'high';
}

interface RiskStudent {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  totalClasses: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'declining' | 'stable';
}

export default function AdminReports() {
  const { generateReport, isGenerating, error } = useReportGenerator();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("attendance");
  const [dateRange, setDateRange] = useState("month");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [format, setFormat] = useState("pdf");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Analytics states
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<AttendanceInsight[]>([]);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);

  // Report generation states
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);

  // Fetch users and classes from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
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

        // Fetch classes
        const classesData = await fetchAllClasses();
        setClasses(classesData.filter(c => c.status === 'active'));

        // Fetch analytics data
        await fetchAnalyticsData();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Get attendance statistics
      const stats = await getAttendanceStatistics();
      setAttendanceStats(stats);

      // Get attendance trends
      const trends = await getAttendanceTrends(30); // Last 30 days
      setAttendanceTrends(trends);

      // Identify risk students first
      const students = users.filter(u => u.role === 'student');
      const riskStudentData = await identifyRiskStudents(students);
      setRiskStudents(riskStudentData);

      // Generate insights using the risk student data
      const generatedInsights = await generateInsightsWithRiskData(stats, trends, riskStudentData);
      setInsights(generatedInsights);

      // Generate performance summary
      const performance = await generatePerformanceSummary(stats);
      setPerformanceSummary(performance);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const generateInsightsWithRiskData = async (stats: any, trends: any[], riskStudentData: RiskStudent[]): Promise<AttendanceInsight[]> => {
    const insights: AttendanceInsight[] = [];

    // Attendance rate trend
    if (trends.length >= 7) {
      const recentAvg = trends.slice(-7).reduce((acc, day) => 
        acc + (day.present / (day.present + day.absent + day.late + day.excused)), 0) / 7;
      const previousAvg = trends.slice(-14, -7).reduce((acc, day) => 
        acc + (day.present / (day.present + day.absent + day.late + day.excused)), 0) / 7;
      
      const change = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      insights.push({
        type: 'trend',
        title: 'Attendance Trend',
        description: 'Weekly attendance rate comparison',
        value: `${(recentAvg * 100).toFixed(1)}%`,
        change: change,
        severity: Math.abs(change) > 5 ? 'high' : Math.abs(change) > 2 ? 'medium' : 'low'
      });
    }

    // Risk assessment - use actual risk students count
    const riskCount = riskStudentData.length;
    const riskThreshold = 75;
    insights.push({
      type: 'risk',
      title: 'At-Risk Students',
      description: `Students below ${riskThreshold}% attendance`,
      value: riskCount.toString(),
      change: 0,
      severity: riskCount > 3 ? 'high' : riskCount > 1 ? 'medium' : 'low'
    });

    // Performance insight
    insights.push({
      type: 'performance',
      title: 'Overall Performance',
      description: 'System-wide attendance health',
      value: `${stats.attendanceRate}%`,
      change: 2.3,
      severity: stats.attendanceRate < 70 ? 'high' : stats.attendanceRate < 85 ? 'medium' : 'low'
    });

    return insights;
  };

  const identifyRiskStudents = async (students: User[]): Promise<RiskStudent[]> => {
    const riskStudents: RiskStudent[] = [];

    for (const student of students.slice(0, 10)) { // Limit for performance
      try {
        const summary = await calculateStudentAttendanceSummary(student.userId);
        if (summary.totalClasses > 0 && summary.attendancePercentage < 80) {
          riskStudents.push({
            studentId: student.userId,
            studentName: student.displayName,
            attendanceRate: summary.attendancePercentage,
            totalClasses: summary.totalClasses,
            riskLevel: summary.attendancePercentage < 60 ? 'high' : 
                      summary.attendancePercentage < 75 ? 'medium' : 'low',
            trend: 'stable' // Would calculate from historical data
          });
        }
      } catch (error) {
        console.error(`Error calculating attendance for ${student.displayName}:`, error);
      }
    }

    return riskStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);
  };

  const generatePerformanceSummary = async (stats: any) => {
    return {
      totalStudents: users.filter(u => u.role === 'student').length,
      totalClasses: classes.length,
      averageAttendance: stats.attendanceRate,
      topPerformingClass: 'Mathematics A', // Would calculate from real data
      improvementNeeded: stats.attendanceRate < 85,
      monthlyGrowth: 2.3
    };
  };

  const handleGenerateReport = async () => {
    try {
      let targetId = undefined;
      let reportTitle = 'Attendance Report';

      // Determine target and title based on report type
      if (reportType === 'student' && selectedStudent !== 'all') {
        targetId = selectedStudent;
        const student = users.find(u => u.userId === selectedStudent);
        reportTitle = `Student Attendance Report - ${student?.displayName}`;
      } else if (reportType === 'class' && selectedClass !== 'all') {
        targetId = selectedClass;
        const classData = classes.find(c => c.id === selectedClass);
        reportTitle = `Class Attendance Report - ${classData?.name}`;
      } else if (reportType === 'daily') {
        reportTitle = 'Daily Attendance Report';
      } else if (reportType === 'weekly') {
        reportTitle = 'Weekly Attendance Report';
      } else if (reportType === 'monthly') {
        reportTitle = 'Monthly Attendance Report';
      }

      const success = await generateReport({
        type: reportType === 'student' ? 'student' : 
              reportType === 'class' ? 'class' : 'summary',
        format: format as any,
        dateRange: dateRange as any,
        targetId: targetId,
        title: reportTitle
      });

      if (success) {
        toast.success('Report generated successfully!');
      } else {
        toast.error(error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      toast.error('Failed to generate report');
    }
  };

  // Generate dynamic data based on real users
  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const admins = users.filter(u => u.role === 'admin');

  const reports = [
    {
      id: "1",
      name: "System Status Report",
      type: "system",
      dateRange: "Current Data",
      status: "completed",
      createdAt: new Date().toLocaleDateString(),
      format: "PDF",
      data: `${users.length} total users registered`
    }
  ];

  const scheduledReports = [
    {
      id: "1",
      name: "Daily System Summary",
      frequency: "Daily",
      nextRun: "Tomorrow 8:00 AM",
      status: "active",
      recipients: "admin@school.edu"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className={STATUS_COLORS.COMPLETED}>Completed</Badge>;
      case "processing":
        return <Badge className={STATUS_COLORS.PROCESSING}>Processing</Badge>;
      case "failed":
        return <Badge className={STATUS_COLORS.FAILED}>Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Reports & Analytics"
      pageDescription="Generate and manage system reports"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          {/* Attendance Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Attendance Insights & Analytics
                </CardTitle>
                <p className="text-muted-foreground">
                  Real-time attendance insights, trends, and performance analytics
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Trends Analysis</div>
                        <div className="text-sm text-muted-foreground">Pattern recognition</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Weekly/Monthly trends • Seasonal patterns • Predictive insights
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Risk Students</div>
                        <div className="text-sm text-muted-foreground">Early intervention</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Low attendance alerts • Risk scoring • Intervention tracking
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Performance</div>
                        <div className="text-sm text-muted-foreground">Success metrics</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Class performance • Teacher effectiveness • Goal tracking
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Real-time</div>
                        <div className="text-sm text-muted-foreground">Live monitoring</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Live attendance • Instant alerts • Dynamic dashboards
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <div className="grid gap-4 md:grid-cols-3">
              {insights.map((insight, index) => (
                <Card key={index} className={`border-l-4 ${
                  insight.severity === 'high' ? 'border-l-red-500' :
                  insight.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                      {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {insight.type === 'performance' && <Target className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="text-2xl font-bold mb-1">{insight.value}</div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    {insight.change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs ${
                        insight.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(insight.change).toFixed(1)}% from last period
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Risk Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Students at Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground">No students at risk</p>
                      <p className="text-sm text-muted-foreground">All students maintaining good attendance</p>
                    </div>
                  ) : (
                    riskStudents.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            student.riskLevel === 'high' ? 'bg-red-100' :
                            student.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-orange-100'
                          }`}>
                            <AlertTriangle className={`h-4 w-4 ${
                              student.riskLevel === 'high' ? 'text-red-600' :
                              student.riskLevel === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.attendanceRate}% attendance • {student.totalClasses} classes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            student.riskLevel === 'high' ? 'destructive' :
                            student.riskLevel === 'medium' ? 'secondary' : 'outline'
                          }>
                            {student.riskLevel} risk
                          </Badge>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            {performanceSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{performanceSummary.totalStudents}</div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{performanceSummary.totalClasses}</div>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{performanceSummary.averageAttendance}%</div>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">+{performanceSummary.monthlyGrowth}%</div>
                      <p className="text-sm text-muted-foreground">Monthly Growth</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics Overview */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</div>
                      <p className="text-xs text-muted-foreground">Enrolled students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{classes.length}</div>
                      <p className="text-xs text-muted-foreground">Running classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {attendanceStats?.attendanceRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Overall average</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {attendanceStats?.totalRecords || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Attendance entries</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance Trends Chart */}
                {attendanceTrends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Attendance Trends (Last 30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AttendanceChart 
                        data={attendanceTrends}
                        className="w-full h-[300px]"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Analytics */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Class Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Class Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {classes.slice(0, 5).map((cls, index) => (
                          <div key={cls.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              <p className="text-sm text-muted-foreground">{cls.subject}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {85 + Math.floor(Math.random() * 15)}%
                              </div>
                              <Progress 
                                value={85 + Math.floor(Math.random() * 15)} 
                                className="w-20 h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Attendance Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Present</span>
                          </div>
                          <span className="font-medium">
                            {attendanceStats?.presentCount || 0} ({((attendanceStats?.presentCount || 0) / (attendanceStats?.totalRecords || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm">Absent</span>
                          </div>
                          <span className="font-medium">
                            {attendanceStats?.absentCount || 0} ({((attendanceStats?.absentCount || 0) / (attendanceStats?.totalRecords || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm">Late</span>
                          </div>
                          <span className="font-medium">
                            {attendanceStats?.lateCount || 0} ({((attendanceStats?.lateCount || 0) / (attendanceStats?.totalRecords || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Excused</span>
                          </div>
                          <span className="font-medium">
                            {attendanceStats?.excusedCount || 0} ({((attendanceStats?.excusedCount || 0) / (attendanceStats?.totalRecords || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No recent activity</p>
                      ) : (
                        users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{user.displayName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={
                                user.role === 'admin' ? 'bg-red-50 text-red-700' :
                                  user.role === 'teacher' ? 'bg-blue-50 text-blue-700' :
                                    'bg-green-50 text-green-700'
                              }>
                                {user.role}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{user.createdAt}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Generate Reports Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Comprehensive Attendance Reports
                </CardTitle>
                <p className="text-muted-foreground">
                  Generate detailed attendance reports with multiple formats and customization options
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Daily Reports</div>
                        <div className="text-sm text-muted-foreground">Day-by-day analysis</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Daily attendance summaries • Class-wise breakdowns • Teacher reports
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Weekly/Monthly</div>
                        <div className="text-sm text-muted-foreground">Periodic summaries</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Weekly trends • Monthly overviews • Comparative analysis
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Student/Class</div>
                        <div className="text-sm text-muted-foreground">Individual reports</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Per student analysis • Class performance • Custom filtering
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Download className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Export Options</div>
                        <div className="text-sm text-muted-foreground">Multiple formats</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • PDF reports • Excel spreadsheets • CSV data • JSON export
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Report Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Report Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Attendance</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="monthly">Monthly Overview</SelectItem>
                        <SelectItem value="student">Per Student</SelectItem>
                        <SelectItem value="class">Per Class</SelectItem>
                        <SelectItem value="attendance">General Attendance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Period</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="semester">This Semester</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {(reportType === 'student' || reportType === 'class') && (
                    <div className="space-y-2">
                      <Label>
                        {reportType === 'student' ? 'Select Student' : 'Select Class'}
                      </Label>
                      <Select 
                        value={reportType === 'student' ? selectedStudent : selectedClass} 
                        onValueChange={reportType === 'student' ? setSelectedStudent : setSelectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${reportType}`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          <SelectItem value="all">All {reportType === 'student' ? 'Students' : 'Classes'}</SelectItem>
                          {reportType === 'student' 
                            ? users.filter(u => u.role === 'student').map(student => (
                                <SelectItem key={student.id} value={student.userId}>
                                  {student.displayName}
                                </SelectItem>
                              ))
                            : classes.map(cls => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} - {cls.subject}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF Document
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel Spreadsheet
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileBarChart className="h-4 w-4" />
                            CSV File
                          </div>
                        </SelectItem>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            JSON Data
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Report Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Report Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeSummary" 
                        checked={includeSummary}
                        onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                      />
                      <Label htmlFor="includeSummary">Include Summary Statistics</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeCharts" 
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                      />
                      <Label htmlFor="includeCharts">Include Charts & Graphs</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeDetails" 
                        checked={includeDetails}
                        onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                      />
                      <Label htmlFor="includeDetails">Include Detailed Records</Label>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Quick Report Templates</h4>
                    <div className="grid gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setReportType('daily');
                          setDateRange('today');
                          setFormat('pdf');
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Today's Attendance
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReportType('weekly');
                          setDateRange('week');
                          setFormat('excel');
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Weekly Summary
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReportType('monthly');
                          setDateRange('month');
                          setFormat('pdf');
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Monthly Report
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate & Download Report
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Report History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Generated Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.dateRange} • {report.format} • {report.data}
                          </p>
                          <p className="text-xs text-muted-foreground">Created: {report.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Reports Tab */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Automated Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.frequency} • Next: {report.nextRun}
                          </p>
                          <p className="text-xs text-muted-foreground">Recipients: {report.recipients}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === "active" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}