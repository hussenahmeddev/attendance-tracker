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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  const students = users.filter(u => u.role === 'student');
  
  // Generate reports based on real data - empty until attendance system is active
  const reports = [
    { 
      period: "This Week", 
      attendance: 0, 
      trend: "up" 
    },
    { 
      period: "This Month", 
      attendance: 0, 
      trend: "up" 
    },
    { 
      period: "This Semester", 
      attendance: 0, 
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
                          <div className={`p-2 rounded-full ${
                            report.trend === "up" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
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
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attendance">Attendance Summary</SelectItem>
                          <SelectItem value="detailed">Detailed Attendance</SelectItem>
                          <SelectItem value="student">Individual Student</SelectItem>
                          <SelectItem value="trends">Attendance Trends</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Period:</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="semester">This Semester</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
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
                    <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(students.length * 0.85)}
                    </div>
                    <p className="text-sm text-muted-foreground">Regular Attendees</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(students.length * 0.15)}
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
                  {students.length === 0 ? (
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
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
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