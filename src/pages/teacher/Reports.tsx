import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, FileText } from "lucide-react";

const mockClasses = [
  { id: "1", name: "Mathematics Grade 10" },
  { id: "2", name: "Physics Grade 11" }
];

const mockReports = [
  { period: "This Week", attendance: 85, trend: "up" },
  { period: "This Month", attendance: 82, trend: "down" },
  { period: "This Semester", attendance: 88, trend: "up" }
];

export default function TeacherReports() {
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Reports"
      pageDescription="View attendance reports and analytics"
    >
      <div className="space-y-6">
        <UserProfile />
        
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
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">Recent Reports</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm">Mathematics Grade 10 - Weekly Report</span>
                  <Button size="sm" variant="outline">Download</Button>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm">Physics Grade 11 - Monthly Report</span>
                  <Button size="sm" variant="outline">Download</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}