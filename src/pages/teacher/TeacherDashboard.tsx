import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/ui/stats-card";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

const todayClasses = [
  { id: "1", name: "Mathematics - Class 10-A", time: "09:00 AM", status: "completed", students: 35 },
  { id: "2", name: "Mathematics - Class 11-B", time: "10:30 AM", status: "current", students: 38 },
  { id: "3", name: "Statistics - Class 12-A", time: "12:00 PM", status: "upcoming", students: 42 },
  { id: "4", name: "Mathematics - Class 9-C", time: "02:00 PM", status: "upcoming", students: 36 },
];

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
}

const mockStudents: Student[] = [
  { id: "1", name: "Alice Johnson", rollNumber: "2024001", status: "present" },
  { id: "2", name: "Bob Smith", rollNumber: "2024002", status: "present" },
  { id: "3", name: "Carol Williams", rollNumber: "2024003", status: "late" },
  { id: "4", name: "David Brown", rollNumber: "2024004", status: "absent" },
  { id: "5", name: "Eva Martinez", rollNumber: "2024005", status: "present" },
  { id: "6", name: "Frank Garcia", rollNumber: "2024006", status: "present" },
];

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>(mockStudents);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  return (
    <DashboardLayout
      role="teacher"
      userName="Sarah Wilson"
      pageTitle="Dashboard"
      pageDescription="Good morning, Sarah"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Classes Today"
            value="4"
            subtitle="2 completed, 2 remaining"
            icon={BookOpen}
          />
          <StatsCard
            title="Total Students"
            value="151"
            subtitle="Across all classes"
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Attendance Marked"
            value="73"
            subtitle="Today's classes"
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Pending Actions"
            value="2"
            subtitle="Requires attention"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Schedule */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Today's Schedule</h3>
              <Button variant="ghost" size="sm" className="gap-1">
                <Calendar className="h-4 w-4" />
                View All
              </Button>
            </div>
            <div className="divide-y">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`flex items-center justify-between p-4 transition-colors ${
                    cls.status === "current" ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${
                      cls.status === "completed" ? "bg-success/10 text-success" :
                      cls.status === "current" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.time} • {cls.students} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cls.status === "completed" && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Done
                      </Badge>
                    )}
                    {cls.status === "current" && (
                      <Button size="sm" variant="hero" className="gap-1">
                        <UserCheck className="h-4 w-4" />
                        Take Attendance
                      </Button>
                    )}
                    {cls.status === "upcoming" && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Attendance */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mathematics - Class 11-B</h3>
                <p className="text-sm text-muted-foreground">Current class • 38 students</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Mark All Present
                </Button>
                <Button variant="hero" size="sm" className="gap-1">
                  Submit
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AttendanceTable
              students={students}
              onStatusChange={handleStatusChange}
              isEditable
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
