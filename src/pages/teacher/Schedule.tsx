import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Edit, Plus } from "lucide-react";

const mockClasses = [
  {
    id: "1",
    name: "Mathematics Grade 10",
    schedule: "Mon, Wed, Fri - 9:00 AM",
    room: "Room 101",
    duration: "1 hour"
  },
  {
    id: "2", 
    name: "Physics Grade 11",
    schedule: "Tue, Thu - 10:30 AM",
    room: "Lab 201",
    duration: "1.5 hours"
  }
];

const weeklySchedule = [
  { day: "Monday", classes: [{ time: "9:00 AM", subject: "Mathematics Grade 10", room: "Room 101" }] },
  { day: "Tuesday", classes: [{ time: "10:30 AM", subject: "Physics Grade 11", room: "Lab 201" }] },
  { day: "Wednesday", classes: [{ time: "9:00 AM", subject: "Mathematics Grade 10", room: "Room 101" }] },
  { day: "Thursday", classes: [{ time: "10:30 AM", subject: "Physics Grade 11", room: "Lab 201" }] },
  { day: "Friday", classes: [{ time: "9:00 AM", subject: "Mathematics Grade 10", room: "Room 101" }] },
];

export default function TeacherSchedule() {
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Schedule"
      pageDescription="View and manage your class schedule"
    >
      <div className="space-y-6">
        <UserProfile />
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Class Schedule Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Class Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.schedule}</p>
                      <p className="text-sm text-muted-foreground">{cls.room} • {cls.duration}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Calendar View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklySchedule.map((day) => (
                  <div key={day.day} className="border rounded-lg p-3">
                    <h3 className="font-semibold mb-2">{day.day}</h3>
                    {day.classes.length > 0 ? (
                      <div className="space-y-2">
                        {day.classes.map((cls, index) => (
                          <div key={index} className="bg-primary/5 p-2 rounded text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{cls.time}</span>
                              <span className="text-muted-foreground">{cls.room}</span>
                            </div>
                            <p className="text-primary">{cls.subject}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No classes scheduled</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Management */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>View Full Calendar</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>Add New Class</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Edit className="h-6 w-6" />
                <span>Modify Schedule</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}