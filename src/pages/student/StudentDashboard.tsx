import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/ui/stats-card";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from "lucide-react";

const subjectAttendance: any[] = [];

const upcomingClasses: any[] = [];

const leaveRequests: any[] = [];

const attendanceData: Record<string, "present" | "absent" | "late" | "holiday" | "weekend" | null> = {};

export default function StudentDashboard() {
  return (
    <DashboardLayout
      role="student"
      pageTitle="My Dashboard"
      pageDescription="Track your attendance and academic progress"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Overall Attendance"
            value="89.5%"
            subtitle="Above minimum requirement"
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Classes Attended"
            value="178"
            subtitle="Out of 199 total classes"
            icon={BookOpen}
          />
          <StatsCard
            title="Leaves Remaining"
            value="5"
            subtitle="Days for this semester"
            icon={Calendar}
            variant="info"
          />
          <StatsCard
            title="Late Arrivals"
            value="8"
            subtitle="This semester"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <AttendanceCalendar attendanceData={attendanceData} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Classes */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-semibold">Today's Classes</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="divide-y">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cls.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.time} • {cls.room}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Requests */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="font-semibold">Leave Requests</h3>
                <Button variant="ghost" size="sm" className="gap-1">
                  <FileText className="h-4 w-4" />
                  New
                </Button>
              </div>
              <div className="divide-y">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{req.dates}</p>
                      <p className="text-xs text-muted-foreground">{req.reason}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        req.status === "approved"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {req.status === "approved" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Subject-wise Attendance</h3>
              <p className="text-sm text-muted-foreground">Your attendance breakdown by subject</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            {subjectAttendance.map((subject) => (
              <div key={subject.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{subject.name}</span>
                  <span className={
                    subject.attendance >= 90 ? "text-success" :
                    subject.attendance >= 75 ? "text-warning" : "text-destructive"
                  }>
                    {subject.attendance}%
                  </span>
                </div>
                <Progress
                  value={subject.attendance}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(subject.classes * subject.attendance / 100)} of {subject.classes} classes attended
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
