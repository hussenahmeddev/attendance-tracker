import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2, XCircle, Clock, TrendingUp, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late';
  time: string;
  teacher: string;
}

const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2024-01-15',
    subject: 'Mathematics',
    status: 'present',
    time: '09:00 AM',
    teacher: 'Dr. Smith'
  },
  {
    id: '2',
    date: '2024-01-15',
    subject: 'Physics',
    status: 'late',
    time: '11:00 AM',
    teacher: 'Prof. Johnson'
  },
  {
    id: '3',
    date: '2024-01-14',
    subject: 'Chemistry',
    status: 'absent',
    time: '02:00 PM',
    teacher: 'Dr. Brown'
  },
  {
    id: '4',
    date: '2024-01-14',
    subject: 'English',
    status: 'present',
    time: '10:00 AM',
    teacher: 'Ms. Davis'
  },
  {
    id: '5',
    date: '2024-01-13',
    subject: 'History',
    status: 'present',
    time: '01:00 PM',
    teacher: 'Mr. Wilson'
  }
];

const subjectStats = [
  { subject: 'Mathematics', present: 28, total: 32, percentage: 87.5 },
  { subject: 'Physics', present: 25, total: 30, percentage: 83.3 },
  { subject: 'Chemistry', present: 22, total: 28, percentage: 78.6 },
  { subject: 'English', present: 30, total: 32, percentage: 93.8 },
  { subject: 'History', present: 26, total: 30, percentage: 86.7 }
];

export default function StudentAttendance() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("january");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const overallAttendance = 86.2;
  const totalClasses = 152;
  const attendedClasses = 131;

  return (
    <DashboardLayout
      role="student"
      pageTitle="My Attendance"
      pageDescription="View your attendance records and statistics"
    >
      <div className="space-y-6">
        <UserProfile />
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">My Attendance</h2>
          <p className="text-muted-foreground">Track your attendance across all subjects</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAttendance}%</div>
              <p className="text-xs text-muted-foreground">
                {attendedClasses} of {totalClasses} classes
              </p>
              <Progress value={overallAttendance} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendedClasses}</div>
              <p className="text-xs text-muted-foreground">
                Classes attended
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalClasses - attendedClasses}</div>
              <p className="text-xs text-muted-foreground">
                Classes missed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">8</div>
              <p className="text-xs text-muted-foreground">
                Times late this semester
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="history">History</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="january">January 2024</SelectItem>
              <SelectItem value="december">December 2023</SelectItem>
              <SelectItem value="november">November 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attendance Records */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>
                  Your latest attendance records across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAttendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{record.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.date)} • {record.time} • {record.teacher}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject-wise Statistics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Subject Statistics</CardTitle>
                <CardDescription>
                  Attendance breakdown by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectStats.map((stat) => (
                    <div key={stat.subject} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{stat.subject}</span>
                        <span className={
                          stat.percentage >= 90 ? "text-green-600" :
                          stat.percentage >= 75 ? "text-yellow-600" : "text-red-600"
                        }>
                          {stat.percentage}%
                        </span>
                      </div>
                      <Progress value={stat.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {stat.present} of {stat.total} classes
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common attendance-related tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>View Calendar</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span>Download Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Filter className="h-6 w-6 mb-2" />
                <span>Advanced Filter</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}