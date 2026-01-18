import { CALENDAR_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";
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
import { addCalendarEvent, deleteCalendarEvent, updateCalendarEvent, subscribeToCalendarEvents, type CalendarEvent } from "@/lib/eventUtils";
import { toast } from "sonner";

// CalendarEvent interface moved to eventUtils.ts

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
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'event' as CalendarEvent['type'],
    location: ''
  });

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

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCalendarEvents((data) => {
      setEvents(data);
    });

    return () => unsubscribe();
  }, []);

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

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    try {
      await addCalendarEvent(eventData);
      toast.success("Event added successfully");
    } catch (error) {
      toast.error("Failed to add event");
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    try {
      await updateCalendarEvent(eventId, eventData);
      toast.success("Event updated successfully");
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteCalendarEvent(eventId);
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      type: event.type,
      location: event.location || ''
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setEventFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'event',
      location: ''
    });
  };

  const handleQuickAction = (type: CalendarEvent['type']) => {
    resetForm();
    setEventFormData(prev => ({ ...prev, type }));
    setIsAddDialogOpen(true);
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
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => e.type === 'event').length}
              </div>
              <p className="text-sm text-muted-foreground">School Events</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e => e.type === 'exam').length}
              </div>
              <p className="text-sm text-muted-foreground">Examinations</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {events.filter(e => e.type === 'holiday').length}
              </div>
              <p className="text-sm text-muted-foreground">Holidays</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Events */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  Academic Calendar
                </CardTitle>
                <CardDescription>
                  Manage important dates and events for the academic year
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white shadow-md"
                    onClick={() => resetForm()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                    <DialogDescription>
                      {selectedEvent ? 'Update the details of this calendar event' : 'Create a new calendar event for the academic year'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (selectedEvent) {
                      await updateEvent(selectedEvent.id, eventFormData);
                    } else {
                      await addEvent(eventFormData);
                    }
                    resetForm();
                    setIsAddDialogOpen(false);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter event title"
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter event description"
                        value={eventFormData.description}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventFormData.date}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          placeholder="e.g., 09:00 AM"
                          value={eventFormData.time}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Event Type</Label>
                      <Select
                        value={eventFormData.type}
                        onValueChange={(value) => setEventFormData(prev => ({ ...prev, type: value as CalendarEvent['type'] }))}
                        required
                      >
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
                      <Input
                        id="location"
                        placeholder="Enter location"
                        value={eventFormData.location}
                        onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {selectedEvent ? 'Update Event' : 'Add Event'}
                      </Button>
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
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading calendar data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No events scheduled</p>
                    <p className="text-sm text-muted-foreground/60">Add your first event to get started</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="group flex items-center justify-between p-5 border rounded-xl hover:bg-accent/30 transition-all duration-200">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                          <Calendar className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-bold text-lg">{event.title}</h3>
                            <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", getEventTypeColor(event.type))}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{event.description}</p>
                          <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground/80">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary/70" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary/70" />
                              {event.time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
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
        <Card className="border-none shadow-md overflow-hidden bg-card/40">
          <CardHeader className="pb-3 bg-muted/20">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-12 justify-start font-semibold border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleQuickAction('holiday')}
              >
                <Plus className="h-5 w-5 mr-3 text-primary" />
                Add Holiday
              </Button>
              <Button
                variant="outline"
                className="h-12 justify-start font-semibold border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleQuickAction('exam')}
              >
                <Calendar className="h-5 w-5 mr-3 text-primary" />
                Schedule Exam
              </Button>
              <Button
                variant="outline"
                className="h-12 justify-start font-semibold border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleQuickAction('break')}
              >
                <Clock className="h-5 w-5 mr-3 text-primary" />
                Set Break Period
              </Button>
              <Button
                variant="outline"
                className="h-12 justify-start font-semibold border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleQuickAction('event')}
              >
                <MapPin className="h-5 w-5 mr-3 text-primary" />
                Plan Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}