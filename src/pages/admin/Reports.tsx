import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Pause
} from "lucide-react";
import { STATUS_COLORS } from "@/config/constants";
import { useReportGenerator } from "@/hooks/useReportGenerator";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
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

export default function AdminReports() {
  const { generateReport, isGenerating, error } = useReportGenerator();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("attendance");
  const [dateRange, setDateRange] = useState("month");
  const [selectedClass, setSelectedClass] = useState("all");
  const [format, setFormat] = useState("pdf");

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

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

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
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Registered in system
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{students.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Enrolled students
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Active faculty
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{admins.length}</div>
                      <p className="text-xs text-muted-foreground">
                        System administrators
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>User Registration Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No users registered yet</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate New Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System Overview (Summary)</SelectItem>
                          <SelectItem value="users">User List (Not Impl)</SelectItem>
                          <SelectItem value="students">Student Report</SelectItem>
                          {/* <SelectItem value="teachers">Teacher Report</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateRange">Date Range</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="semester">This Semester</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Student Selector if type is student - Simplified for dynamic loading */}
                    {reportType === 'students' && (
                      <div className="space-y-2">
                        <Label htmlFor="studentSelect">Select Student</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.userId}>{s.displayName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="csv">CSV File</SelectItem>
                          <SelectItem value="json">JSON Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Recipients (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@school.edu, teacher@school.edu"
                        disabled
                      />
                      <p className='text-xs text-muted-foreground'>Email feature coming soon</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    className="flex-1"
                    onClick={async () => {
                      const targetId = reportType === 'students' ? selectedClass : undefined;
                      // Map report type string to hook type
                      let hookType: any = 'summary';
                      if (reportType === 'system') hookType = 'system';
                      if (reportType === 'students') hookType = 'student';

                      const success = await generateReport({
                        type: hookType,
                        format: format as any,
                        dateRange: dateRange as any,
                        targetId: targetId,
                        title: `Admin ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
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
                  <Button variant="outline" disabled>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
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