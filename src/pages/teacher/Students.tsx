import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Eye, TrendingUp } from "lucide-react";

const mockClasses = [
  { id: "1", name: "Mathematics Grade 10" },
  { id: "2", name: "Physics Grade 11" }
];

const mockStudents = [
  { id: "1", name: "John Doe", rollNo: "STD001", attendance: 85, performance: "Good" },
  { id: "2", name: "Jane Smith", rollNo: "STD002", attendance: 92, performance: "Excellent" },
  { id: "3", name: "Mike Johnson", rollNo: "STD003", attendance: 78, performance: "Average" },
  { id: "4", name: "Sarah Wilson", rollNo: "STD004", attendance: 65, performance: "At Risk" },
];

export default function TeacherStudents() {
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Students"
      pageDescription="View and track your students' progress"
    >
      <div className="space-y-6">
        <UserProfile />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Performance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Class:</label>
              <select className="w-full p-2 border rounded-lg">
                <option>All Classes</option>
                {mockClasses.map((cls) => (
                  <option key={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {mockStudents.map((student) => (
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
                      <p className="font-semibold">{student.attendance}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <Badge 
                        variant="outline" 
                        className={
                          student.performance === "Excellent" ? "bg-success/10 text-success" :
                          student.performance === "Good" ? "bg-primary/10 text-primary" :
                          student.performance === "Average" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }
                      >
                        {student.performance}
                      </Badge>
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
                  <p className="text-2xl font-bold text-success">80%</p>
                  <p className="text-sm text-muted-foreground">Average Attendance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">1</p>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}