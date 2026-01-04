import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Eye, Edit, Plus } from "lucide-react";

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

export default function TeacherClasses() {
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="My Classes"
      pageDescription="View and manage your assigned classes"
    >
      <div className="space-y-6">
        <UserProfile />
        
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
      </div>
    </DashboardLayout>
  );
}