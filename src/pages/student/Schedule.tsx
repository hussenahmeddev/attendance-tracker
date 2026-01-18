import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, MapPin, TrendingUp, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEnrolledClassesForStudent, type Class } from "@/lib/classUtils";
import { cn } from "@/lib/utils";
import { subscribeToCalendarEvents, type CalendarEvent } from "@/lib/eventUtils";

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentSchedule() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(weekDays[new Date().getDay() - 1] || 'Monday');

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!userData?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const enrolledClasses = await getEnrolledClassesForStudent(userData.userId);
        setClasses(enrolledClasses);
      } catch (error) {
        console.error('Error fetching student schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribeEvents = subscribeToCalendarEvents((data) => {
      setEvents(data);
    });

    fetchSchedule();
    return () => unsubscribeEvents();
  }, [userData]);

  const getClassesForDay = (day: string) => {
    return classes.filter(cls =>
      cls.schedule && cls.schedule.toLowerCase().includes(day.toLowerCase().substring(0, 3))
    );
  };

  const selectedDayClasses = getClassesForDay(selectedDay);
  const selectedDayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[eventDate.getDay()] === selectedDay;
  });

  return (
    <DashboardLayout
      role="student"
      pageTitle="My Schedule"
      pageDescription="View your class schedule and upcoming sessions"
    >
      <div className="space-y-6">
        <UserProfile />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Syncing your schedule...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Day Selector */}
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "default" : "outline"}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex-1 min-w-[100px] transition-all duration-200",
                        selectedDay === day && "shadow-md scale-105"
                      )}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule Card */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-primary/5 pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5 text-primary" />
                      {selectedDay}'s Classes
                    </CardTitle>
                    <CardDescription>
                      You have {selectedDayClasses.length} sessions scheduled
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-white/50">
                    {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Events Section - Show prominently if any */}
                  {selectedDayEvents.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">Academic Events</p>
                      </div>
                      {selectedDayEvents.map(event => (
                        <div key={event.id} className="flex flex-col p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">{event.title}</h4>
                            <Badge variant="outline" className="text-[10px] bg-white">{event.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            {event.time && (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                                <Clock className="h-3.5 w-3.5" />
                                {event.time}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Classes Section */}
                  {selectedDayClasses.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDayEvents.length > 0 && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">Scheduled Classes</p>}
                      {selectedDayClasses.map((cls, index) => (
                        <div key={cls.id} className="group flex items-center justify-between p-4 border rounded-xl hover:bg-accent/30 transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{cls.name}</h3>
                              <div className="flex flex-wrap gap-4 mt-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                                  {cls.schedule.split(' - ')[1] || cls.schedule}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                  {cls.room}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                  {cls.subject}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="hidden sm:flex font-bold px-3">
                            Upcoming
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : selectedDayEvents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground font-medium text-lg">No activities for {selectedDay}</p>
                      <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                        Enjoy your free time or use it for independent study!
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Overview - Miniature Style */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="md:col-span-2 lg:col-span-3 border-none shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-lg">Weekly Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-4 sm:grid-cols-5">
                    {weekDays.map((day) => {
                      const dayClasses = getClassesForDay(day);
                      return (
                        <div key={day} className={cn(
                          "p-3 rounded-xl border transition-all",
                          day === selectedDay ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-card"
                        )}>
                          <p className="font-bold text-sm mb-3 text-center border-b pb-2">{day.substring(0, 3)}</p>
                          <div className="space-y-2">
                            {dayClasses.map(cls => (
                              <div key={cls.id} className="p-2 bg-white rounded-lg border text-[10px] shadow-sm">
                                <p className="font-bold truncate">{cls.name}</p>
                                <p className="text-muted-foreground truncate">{cls.schedule.split(' - ')[1] || cls.schedule}</p>
                              </div>
                            ))}
                            {dayClasses.length === 0 && (
                              <p className="text-[10px] text-muted-foreground text-center py-2 italic font-medium opacity-50">Free</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Active</Badge>
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{classes.length}</h3>
                  <p className="text-blue-100 font-medium opacity-90">Total Enrolled Courses</p>
                  <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-2/3 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Class Hint */}
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="font-bold text-slate-800">Quick Reminder</p>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">
                    Always arrive 5 minutes early to your class to ensure your attendance is marked correctly.
                  </p>
                  <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold">
                    View Materials
                  </Button>
                </CardContent>
              </Card>

              {/* Attendance Context */}
              <Card className="border-none shadow-md bg-white lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="font-bold text-slate-800">Attendance Focus</p>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">
                    Your attendance is being tracked in real-time. Keep up the good work!
                  </p>
                  <Button variant="ghost" className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 font-bold">
                    Check Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
