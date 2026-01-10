import { CALENDAR_COLORS } from "@/config/constants";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Clock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'holiday' | 'exam' | 'event' | 'break' | 'system';
  location?: string;
}

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function AdminCalendar() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || 'N/A',
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
            role: data.role || 'student',
            status: data.status || 'active',
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
          } as User;
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Generate events based on real system data - minimal system events only
  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'EduTrack System Launch',
        description: 'Attendance tracking system is now active',
        date: new Date().toISOString().split('T')[0],
        time: '09:00 AM',
        type: 'system',
      }
    ];

    // Add user milestone events only if there are users
    if (users.length > 0) {
      events.push({
        id: '2',
        title: 'First Users Registered',
        description: `${users.length} users have joined the system`,
        date: new Date().toISOString().split('T')[0],
        time: 'All Day',
        type: 'system',
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!loading) {
      setEvents(generateEvents());
    }
  }, [users, loading]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return CALENDAR_COLORS.HOLIDAY;
      case 'exam':
        return CALENDAR_COLORS.EXAM;
      case 'event':
        return CALENDAR_COLORS.EVENT;
      case 'break':
        return CALENDAR_COLORS.BREAK;
      case 'system':
        return CALENDAR_COLORS.SYSTEM;
      default:
        return CALENDAR_COLORS.DEFAULT;
    }
  };

  const addEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
    };
    setEvents(prev => [...prev, newEvent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Academic Calendar"
      pageDescription="Manage academic events, holidays, and important dates"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Calendar Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => e.type === 'event').length}
              </div>
              <p className="text-sm text-muted-foreground">School Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e => e.type === 'exam').length}
              </div>
              <p className="text-sm text-muted-foreground">Examinations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {events.filter(e => e.type === 'holiday').length}
              </div>
              <p className="text-sm text-muted-foreground">Holidays</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Events */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Academic Calendar
                </CardTitle>
                <CardDescription>
                  Manage important dates and events for the academic year
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                      Create a new calendar event for the academic year
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    addEvent({
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      date: formData.get('date') as string,
                      time: formData.get('time') as string,
                      type: formData.get('type') as CalendarEvent['type'],
                      location: formData.get('location') as string || undefined,
                    });
                    setIsAddDialogOpen(false);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input id="title" name="title" placeholder="Enter event title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Enter event description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input id="time" name="time" placeholder="e.g., 09:00 AM" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Event Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event">School Event</SelectItem>
                          <SelectItem value="exam">Examination</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                          <SelectItem value="break">Academic Break</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (Optional)</Label>
                      <Input id="location" name="location" placeholder="Enter location" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Add Event</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No events scheduled</p>
                    <p className="text-sm text-muted-foreground">Add your first event to get started</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{event.title}</h3>
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Exam
              </Button>
              <Button variant="outline" className="justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Set Break Period
              </Button>
              <Button variant="outline" className="justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Plan Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}