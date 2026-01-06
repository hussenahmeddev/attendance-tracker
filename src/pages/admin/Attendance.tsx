import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AttendanceChart } from "@/components/attendance/AttendanceChart";
import { 
  ClipboardCheck, 
  Users, 
  TrendingDown, 
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchAllClasses } from "@/lib/classUtils";
import { 
  fetchAllAttendance,
  getAttendanceStatistics,
  calculateStudentAttendanceSummary,
  getAttendanceTrends,
  type AttendanceRecord,
  type StudentAttendanceSummary
} from "@/lib/attendanceUtils";

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

export default function AdminAttendance() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<StudentAttendanceSummary[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);

  // Fetch users, classes, and attendance data
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

        // Fetch attendance data
        await fetchAttendanceData();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      // Get date range based on filter
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const today = new Date();
      if (dateFilter === 'today') {
        startDate = endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }

      // Fetch attendance records
      const records = await fetchAllAttendance(startDate, endDate);
      setAttendanceRecords(records);

      // Get attendance statistics
      const stats = await getAttendanceStatistics(startDate, endDate);
      setAttendanceStats(stats);

      // Get attendance trends for chart
      const trends = await getAttendanceTrends(7);
      setAttendanceTrends(trends);

      // Find students with low attendance
      const students = users.filter(u => u.role === 'student');
      const lowAttendancePromises = students.map(async (student) => {
        const summary = await calculateStudentAttendanceSummary(student.userId);
        return summary;
      });
      
      const summaries = await Promise.all(lowAttendancePromises);
      const lowAttendance = summaries.filter(s => s.attendancePercentage < 80 && s.totalClasses > 0);
      setLowAttendanceStudents(lowAttendance);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchAttendanceData();
    }
  }, [dateFilter, classFilter]);

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');

  const filteredAttendance = attendanceRecords.filter(record => {
    const matchesClass = classFilter === "all" || record.classId === classFilter;
    const matchesSearch = record.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Calculate statistics from real data
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceStats?.presentCount || 0;
  const absentCount = attendanceStats?.absentCount || 0;
  const lateCount = attendanceStats?.lateCount || 0;
  const attendanceRate = attendanceStats?.attendanceRate || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Attendance Management"
      pageDescription="Monitor and manage student attendance across all classes"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="alerts">Low Attendance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading attendance data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                      <p className="text-sm text-muted-foreground">Overall Attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                      <p className="text-sm text-muted-foreground">Present</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                      <p className="text-sm text-muted-foreground">Absent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                      <p className="text-sm text-muted-foreground">Late</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Date Filter */}
                <div className="flex gap-4 items-center">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchAttendanceData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {/* Attendance Trends Chart */}
                {attendanceTrends.length > 0 && (
                  <AttendanceChart 
                    data={attendanceTrends}
                    className="w-full"
                  />
                )}

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Student Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Students</span>
                          <span className="font-semibold">{students.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Students</span>
                          <span className="font-semibold">{students.filter(s => s.status === 'active').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Low Attendance</span>
                          <span className="font-semibold text-red-600">{lowAttendanceStudents.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Class Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Classes</span>
                          <span className="font-semibold">{classes.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Teachers</span>
                          <span className="font-semibold">{teachers.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Attendance Records</span>
                          <span className="font-semibold">{totalRecords}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Attendance Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search students or classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Records List */}
                <div className="space-y-3">
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">Records will appear once attendance is taken</p>
                    </div>
                  ) : (
                    filteredAttendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.studentId} • {record.className}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Teacher: {record.teacher} • {record.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Attendance Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Students with Low Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowAttendanceStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground">Great! No students with low attendance</p>
                      <p className="text-sm text-muted-foreground">All students are maintaining good attendance rates</p>
                    </div>
                  ) : (
                    lowAttendanceStudents.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.studentId} • {student.attendancePercentage}% attendance
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.totalClasses} total classes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {student.attendancePercentage}%
                          </Badge>
                          <Button size="sm" variant="outline">
                            Contact Student
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                    <p className="text-sm text-muted-foreground">Average Attendance Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {students.filter(s => s.status === 'active').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Regular Attendees</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{lowAttendanceStudents.length}</div>
                    <p className="text-sm text-muted-foreground">Need Intervention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Attendance Summary Report</h3>
                    <div className="space-y-2">
                      <Label>Time Period</Label>
                      <Select defaultValue="month">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="semester">This Semester</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Summary Report
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Student Attendance Report</h3>
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.userId}>
                              {student.displayName} ({student.userId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" placeholder="Start date" />
                        <Input type="date" placeholder="End date" />
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Student Report
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{attendanceStats?.uniqueStudents || 0}</div>
                      <div className="text-muted-foreground">Active Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{attendanceStats?.uniqueClasses || 0}</div>
                      <div className="text-muted-foreground">Active Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{totalRecords}</div>
                      <div className="text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{attendanceRate}%</div>
                      <div className="text-muted-foreground">Avg Attendance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}