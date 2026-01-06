import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentSchedule() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(weekDays[new Date().getDay() - 1] || 'Monday');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout
      role="student"
      pageTitle="My Schedule"
      pageDescription="View your class schedule and upcoming sessions"
    >
      <div className="space-y-6">
        <UserProfile />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Current Day Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule - {selectedDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(day)}
                      className="whitespace-nowrap"
                    >
                      {day}
                    </Button>
                  ))}
                </div>

                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No classes scheduled for {selectedDay}</p>
                  <p className="text-sm text-muted-foreground">
                    Your class schedule will appear here once classes are assigned by administrators.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  {weekDays.map((day) => (
                    <div key={day} className="space-y-2">
                      <h3 className="font-semibold text-center">{day}</h3>
                      <div className="text-center p-4 border rounded text-sm text-muted-foreground">
                        No classes scheduled
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <p className="text-sm text-muted-foreground">Lectures</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-sm text-muted-foreground">Lab Sessions</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <p className="text-sm text-muted-foreground">Tutorials</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  <Button variant="outline" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full Calendar
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Set Reminders
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Course Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}