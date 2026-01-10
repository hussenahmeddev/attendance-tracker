import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchTeacherClasses, type Class } from "@/lib/classUtils";
import { getAttendanceStatistics, fetchTeacherAttendance } from "@/lib/attendanceUtils";
import { DEFAULT_VALUES } from "@/config/constants";

interface Student {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status: "present" | "absent" | "late" | "active";
  createdAt: string;
}

export default function TeacherDashboard() {
  const { userData, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    attendanceRate: DEFAULT_VALUES.ATTENDANCE_RATE,
    totalClasses: DEFAULT_VALUES.TOTAL_CLASSES,
    classesToday: DEFAULT_VALUES.CLASSES_TODAY,
    totalStudents: DEFAULT_VALUES.TOTAL_STUDENTS
  });

  // Fetch teacher's classes and students
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.userId) return;

      try {
        // Fetch teacher's classes
        const teacherClasses = await fetchTeacherClasses(userData.userId);
        setClasses(teacherClasses.filter(c => c.status === 'active'));

        // Fetch all students (for display purposes)
        const usersCollection = collection(db, 'users');
        const studentsQuery = query(usersCollection, where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);

        const studentsData = studentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || 'N/A',
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
            role: data.role || 'student',
            status: 'present' as const, // Default attendance status
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
          } as Student;
        });
        setStudents(studentsData);

        // Set default stats for now to make page visible
        setAttendanceStats({
          attendanceRate: DEFAULT_VALUES.ATTENDANCE_RATE,
          totalClasses: teacherClasses.length,
          classesToday: teacherClasses.filter(c => c.status === 'active').length,
          totalStudents: teacherClasses.reduce((acc, cls) => acc + (cls.students || DEFAULT_VALUES.STUDENT_COUNT), DEFAULT_VALUES.STUDENT_COUNT)
        });

      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchData();
  }, [userData]);



  const [selectedClass, setSelectedClass] = useState(classes.length > DEFAULT_VALUES.STUDENT_COUNT ? classes[DEFAULT_VALUES.STUDENT_COUNT] : {
    id: "default",
    name: "No Classes Available",
    subject: "N/A",
    grade: "N/A",
    students: DEFAULT_VALUES.STUDENT_COUNT,
    schedule: "Not scheduled",
    room: "N/A"
  });

  // Update selectedClass when classes change
  useEffect(() => {
    if (classes.length > DEFAULT_VALUES.STUDENT_COUNT) {
      setSelectedClass(classes[DEFAULT_VALUES.STUDENT_COUNT]);
    } else {
      setSelectedClass({
        id: "default",
        name: "No Classes Available",
        subject: "N/A",
        grade: "N/A",
        students: DEFAULT_VALUES.STUDENT_COUNT,
        schedule: "Not scheduled",
        room: "N/A"
      });
    }
  }, [students.length]);

  const reports = [
    { period: "This Week", attendance: DEFAULT_VALUES.ATTENDANCE_RATE, trend: "up" },
    { period: "This Month", attendance: DEFAULT_VALUES.ATTENDANCE_RATE, trend: "up" },
    { period: "This Semester", attendance: DEFAULT_VALUES.ATTENDANCE_RATE, trend: "up" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents(prev =>
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Teacher Dashboard"
      pageDescription="Manage your classes and track student progress"
    >
      <div className="space-y-6">
        {/* User Profile */}
        <UserProfile />

        {/* Main Functionality Tabs */}
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="attendance">Take Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* View Assigned Classes */}
          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Assigned Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <Card key={cls.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{cls.name}</h3>
                              <p className="text-muted-foreground">{cls.subject} • Grade {cls.grade}</p>
                            </div>
                            <Badge variant="outline">{cls.students} students</Badge>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {cls.schedule}
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {cls.room}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes assigned</p>
                      <p className="text-sm text-muted-foreground">Contact admin to get classes assigned</p>
                    </div>
                  )}
                </div>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Request New Class
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Take Attendance */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Take Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Class:</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={selectedClass.id}
                    onChange={(e) => {
                      const foundClass = classes.find(c => c.id === e.target.value);
                      if (foundClass) {
                        setSelectedClass(foundClass);
                      }
                    }}
                  >
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))
                    ) : (
                      <option value="default">No Classes Available</option>
                    )}
                  </select>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">{selectedClass.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()} • {selectedClass.students} students
                  </p>
                </div>

                <div className="space-y-3">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Loading students...</p>
                      </div>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No students found</p>
                      <p className="text-sm text-muted-foreground">Students will appear here once they register</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.displayName}</p>
                            <p className="text-sm text-muted-foreground">{student.userId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={student.status === "present" ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(student.id, "present")}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "absent" ? "destructive" : "outline"}
                            onClick={() => handleAttendanceChange(student.id, "absent")}
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "late" ? "secondary" : "outline"}
                            onClick={() => handleAttendanceChange(student.id, "late")}
                            className="gap-1"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Late
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">
                    Save Attendance
                  </Button>
                  <Button variant="outline">
                    Mark All Present
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Reports */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Attendance Reports
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
                          <div className={`p-2 rounded-full ${report.trend === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
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
                      <label className="block text-sm font-medium">Class:</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option>All Classes</option>
                        {classes.length > 0 ? (
                          classes.map((cls) => (
                            <option key={cls.id}>{cls.name}</option>
                          ))
                        ) : (
                          <option>No Classes Available</option>
                        )}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Period:</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Semester</option>
                        <option>Custom Range</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full">
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Class Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground">{cls.schedule}</p>
                          <p className="text-sm text-muted-foreground">{cls.room}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            View Calendar
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes scheduled</p>
                      <p className="text-sm text-muted-foreground">Contact admin to get classes assigned</p>
                    </div>
                  )}
                </div>
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Performance */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Performance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Class:</label>
                  <select className="w-full p-2 border rounded-lg">
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <option key={cls.id}>{cls.name}</option>
                      ))
                    ) : (
                      <option>No Classes Available</option>
                    )}
                  </select>
                </div>

                <div className="space-y-3">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No students found</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.displayName}</p>
                            <p className="text-sm text-muted-foreground">{student.userId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Attendance</p>
                            <p className="font-semibold">{attendanceStats.attendanceRate}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Performance</p>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Good</Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Class Performance Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{attendanceStats.attendanceRate}%</p>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{attendanceStats.totalStudents}</p>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{attendanceStats.totalClasses}</p>
                      <p className="text-sm text-muted-foreground">My Classes</p>
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