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
  ClipboardCheck, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  BarChart3
} from "lucide-react";
import { useState } from "react";

const mockAttendanceData = [
  { 
    id: "1", 
    className: "Mathematics Grade 10", 
    date: "2024-01-15", 
    totalStudents: 28, 
    present: 25, 
    absent: 2, 
    late: 1,
    teacher: "Sarah Teacher"
  },
  { 
    id: "2", 
    className: "Physics Grade 11", 
    date: "2024-01-15", 
    totalStudents: 24, 
    present: 22, 
    absent: 1, 
    late: 1,
    teacher: "Mike Instructor"
  },
  { 
    id: "3", 
    className: "Mathematics Grade 10", 
    date: "2024-01-14", 
    totalStudents: 28, 
    present: 26, 
    absent: 1, 
    late: 1,
    teacher: "Sarah Teacher"
  }
];

const mockLowAttendanceStudents = [
  { id: "STD001", name: "Alice Student", class: "Mathematics Grade 10", attendance: 65, trend: "down" },
  { id: "STD002", name: "Bob Student", class: "Physics Grade 11", attendance: 58, trend: "down" },
  { id: "STD003", name: "Charlie Student", class: "Mathematics Grade 10", attendance: 72, trend: "up" }
];

const mockClasses = [
  { id: "1", name: "Mathematics Grade 10" },
  { id: "2", name: "Physics Grade 11" },
  { id: "3", name: "Chemistry Grade 12" }
];

export default function AdminAttendance() {
  const [dateFilter, setDateFilter] = useState("today");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAttendance = mockAttendanceData.filter(record => {
    const matchesClass = classFilter === "all" || record.className.includes(classFilter);
    const matchesSearch = record.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const calculateAttendanceRate = (present: number, total: number) => {
    return Math.round((present / total) * 100);
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Attendance Overview"
      pageDescription="Monitor attendance across all classes"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="real-time">Real-time</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="low-attendance">At Risk</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Attendance</p>
                      <p className="text-2xl font-bold">89%</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Present Students</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Absent Students</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Late Arrivals</p>
                      <p className="text-2xl font-bold">2</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search classes or teachers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {mockClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attendance Records */}
                <div className="space-y-3">
                  {filteredAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{record.className}</h3>
                          <p className="text-sm text-muted-foreground">
                            {record.teacher} • {record.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                          <p className="text-lg font-semibold">
                            {calculateAttendanceRate(record.present, record.totalStudents)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Present</p>
                          <p className="text-lg font-semibold text-green-600">{record.present}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Absent</p>
                          <p className="text-lg font-semibold text-red-600">{record.absent}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Late</p>
                          <p className="text-lg font-semibold text-yellow-600">{record.late}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="real-time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Real-time Attendance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-green-800">Mathematics Grade 10</h3>
                      <p className="text-sm text-green-600">Currently in session • 25/28 present</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-blue-800">Physics Grade 11</h3>
                      <p className="text-sm text-blue-600">Starting in 15 minutes • 0/24 present</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Chemistry Grade 12</h3>
                      <p className="text-sm text-gray-600">Completed • 20/22 attended</p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Live Updates</h3>
                  <div className="space-y-2 text-sm">
                    <p>• Alice Student marked present in Mathematics Grade 10 (2 min ago)</p>
                    <p>• Bob Student marked late in Physics Grade 11 (5 min ago)</p>
                    <p>• Charlie Student marked absent in Mathematics Grade 10 (8 min ago)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>This Week</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">87%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Week</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">84%</span>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>This Month</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">86%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Class Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockClasses.map((cls, index) => (
                      <div key={cls.id} className="flex justify-between items-center">
                        <span className="text-sm">{cls.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${85 + index * 3}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{85 + index * 3}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">92%</p>
                    <p className="text-sm text-muted-foreground">Average Attendance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">156</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                    <p className="text-sm text-muted-foreground">Late Arrivals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">8</p>
                    <p className="text-sm text-muted-foreground">Chronic Absentees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Attendance Tab */}
          <TabsContent value="low-attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Students with Low Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockLowAttendanceStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-red-600">{student.attendance}%</p>
                            {getTrendIcon(student.trend)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm">
                            Contact Parent
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Intervention Recommendations</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Schedule parent-teacher conferences for students below 70%</li>
                    <li>• Implement attendance improvement plans</li>
                    <li>• Consider additional support services</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Data Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Attendance Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exportClass">Select Class</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {mockClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateRange">Date Range</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="semester">This Semester</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="pdf">PDF Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Include</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">Student Names</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">Attendance Percentages</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Late Arrivals</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Absence Reasons</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}