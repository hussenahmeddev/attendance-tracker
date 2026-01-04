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
import { useState } from "react";

// Mock data - replace with real data from Firebase
const mockClasses = [
  {
    id: "1",
    name: "Mathematics Grade 10",
    subject: "Mathematics",
    grade: "10",
    students: 28,
    schedule: "Mon, Wed, Fri - 9:00 AM",
    room: "Room 101"
  },
  {
    id: "2", 
    name: "Physics Grade 11",
    subject: "Physics",
    grade: "11",
    students: 24,
    schedule: "Tue, Thu - 10:30 AM",
    room: "Lab 201"
  }
];

const mockStudents = [
  { id: "1", name: "John Doe", rollNo: "STD001", status: "present" as const },
  { id: "2", name: "Jane Smith", rollNo: "STD002", status: "absent" as const },
  { id: "3", name: "Mike Johnson", rollNo: "STD003", status: "present" as const },
];

const mockReports = [
  { period: "This Week", attendance: 85, trend: "up" },
  { period: "This Month", attendance: 82, trend: "down" },
  { period: "This Semester", attendance: 88, trend: "up" }
];

export default function TeacherDashboard() {
  const { userData, loading } = useAuth();
  const [selectedClass, setSelectedClass] = useState(mockClasses[0]);
  const [students, setStudents] = useState(mockStudents);

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
                  {mockClasses.map((cls) => (
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
                  ))}
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
                    onChange={(e) => setSelectedClass(mockClasses.find(c => c.id === e.target.value) || mockClasses[0])}
                  >
                    {mockClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">{selectedClass.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()} • {selectedClass.students} students
                  </p>
                </div>

                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.rollNo}</p>
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
                  ))}
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
                  {mockReports.map((report, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{report.period}</p>
                            <p className="text-2xl font-bold">{report.attendance}%</p>
                          </div>
                          <div className={`p-2 rounded-full ${
                            report.trend === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
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
                        {mockClasses.map((cls) => (
                          <option key={cls.id}>{cls.name}</option>
                        ))}
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
                  {mockClasses.map((cls) => (
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
                  ))}
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
                    {mockClasses.map((cls) => (
                      <option key={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Attendance</p>
                          <p className="font-semibold">85%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Performance</p>
                          <Badge variant="outline" className="bg-success/10 text-success">Good</Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Class Performance Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-success">85%</p>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">24</p>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">3</p>
                      <p className="text-sm text-muted-foreground">At Risk</p>
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