import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/ui/stats-card";
import { AttendanceChart } from "@/components/attendance/AttendanceChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

const chartData = [
  { date: "Mon", present: 92, absent: 5, late: 3 },
  { date: "Tue", present: 88, absent: 8, late: 4 },
  { date: "Wed", present: 95, absent: 3, late: 2 },
  { date: "Thu", present: 90, absent: 6, late: 4 },
  { date: "Fri", present: 87, absent: 9, late: 4 },
];

const recentActivity = [
  { id: 1, type: "alert", message: "Class 10-A attendance dropped below 80%", time: "5 min ago" },
  { id: 2, type: "success", message: "Class 12-B achieved 100% attendance", time: "1 hour ago" },
  { id: 3, type: "info", message: "New student enrolled in Class 9-C", time: "2 hours ago" },
  { id: 4, type: "alert", message: "Teacher John Smith hasn't marked attendance", time: "3 hours ago" },
];

const topClasses = [
  { name: "Class 12-A", attendance: 98, students: 45 },
  { name: "Class 11-B", attendance: 96, students: 42 },
  { name: "Class 10-C", attendance: 94, students: 40 },
  { name: "Class 9-A", attendance: 92, students: 38 },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout
      role="admin"
      pageTitle="Dashboard"
      pageDescription="Welcome back, Admin"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="2,847"
            subtitle="Across 64 classes"
            icon={GraduationCap}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Teachers"
            value="128"
            subtitle="Active staff members"
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Today's Attendance"
            value="94.2%"
            subtitle="2,681 students present"
            icon={CheckCircle2}
            variant="success"
            trend={{ value: 2.5, isPositive: true }}
          />
          <StatsCard
            title="At-Risk Students"
            value="23"
            subtitle="Below 75% attendance"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart */}
          <div className="lg:col-span-2">
            <AttendanceChart data={chartData} />
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="divide-y">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 rounded-full p-1 ${
                    activity.type === "alert" ? "bg-warning/10 text-warning" :
                    activity.type === "success" ? "bg-success/10 text-success" :
                    "bg-info/10 text-info"
                  }`}>
                    {activity.type === "alert" && <AlertTriangle className="h-3 w-3" />}
                    {activity.type === "success" && <CheckCircle2 className="h-3 w-3" />}
                    {activity.type === "info" && <Clock className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performing Classes */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Top Performing Classes</h3>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="divide-y">
              {topClasses.map((cls, index) => (
                <div key={cls.name} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.students} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {cls.attendance}%
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Users className="h-5 w-5" />
                <span>Add New User</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <BookOpen className="h-5 w-5" />
                <span>Create Class</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <TrendingUp className="h-5 w-5" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <AlertTriangle className="h-5 w-5" />
                <span>View Alerts</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
