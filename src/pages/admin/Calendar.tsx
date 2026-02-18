import { CALENDAR_COLORS } from "@/config/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, Users, BookOpen, AlertTriangle, Settings, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  addCalendarEvent, 
  deleteCalendarEvent, 
  updateCalendarEvent, 
  subscribeToCalendarEvents, 
  subscribeToClassSchedules,
  subscribeToScheduleChanges,
  addClassSchedule,
  createScheduleChange,
  type CalendarEvent,
  type ClassSchedule,
  type ScheduleChange
} from "@/lib/eventUtils";
import { fetchAllClasses, type Class } from "@/lib/classUtils";
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");
  
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    type: 'event' as CalendarEvent['type'],
    location: '',
    priority: 'medium' as CalendarEvent['priority'],
    affectedUsers: [] as string[]
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    classId: '',
    className: '',
    teacherId: '',
    teacherName: '',
    subject: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    room: '',
    effectiveFrom: '',
    effectiveTo: '',
    isActive: true
  });

  const [changeFormData, setChangeFormData] = useState({
    originalScheduleId: '',
    changeType: 'cancelled' as ScheduleChange['changeType'],
    originalDate: '',
    newDate: '',
    originalTime: '',
    newTime: '',
    originalRoom: '',
    newRoom: '',
    reason: '',
    affectedUsers: [] as string[]
  });

  // Fetch users and classes from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
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

        // Fetch classes
        const classesData = await fetchAllClasses();
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);

  useEffect(() => {
    const unsubscribeEvents = subscribeToCalendarEvents((data) => {
      setEvents(data);
    });

    const unsubscribeSchedules = subscribeToClassSchedules((data) => {
      setSchedules(data);
    });

    const unsubscribeChanges = subscribeToScheduleChanges((data) => {
      setScheduleChanges(data);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeSchedules();
      unsubscribeChanges();
    };
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

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy'>) => {
    try {
      await addCalendarEvent({
        ...eventData,
        status: 'active',
        createdBy: 'admin'
      });
      toast.success("Event added successfully");
    } catch (error) {
      toast.error("Failed to add event");
    }
  };

  const addSchedule = async (scheduleData: Omit<ClassSchedule, 'id' | 'createdAt' | 'isActive'>) => {
    try {
      const selectedClass = classes.find(c => c.id === scheduleData.classId);
      if (!selectedClass) {
        toast.error("Class not found");
        return;
      }

      await addClassSchedule({
        ...scheduleData,
        className: selectedClass.name,
        teacherId: selectedClass.teacherId,
        teacherName: selectedClass.teacher,
        isActive: true
      });
      toast.success("Class schedule added successfully");
    } catch (error) {
      toast.error("Failed to add class schedule");
    }
  };

  const createChange = async (changeData: Omit<ScheduleChange, 'id' | 'createdAt' | 'notificationSent' | 'createdBy'>) => {
    try {
      await createScheduleChange({
        ...changeData,
        createdBy: 'admin'
      });
      toast.success("Schedule change created and notifications sent");
    } catch (error) {
      toast.error("Failed to create schedule change");
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      await updateCalendarEvent(eventId, {
        ...eventData,
        updatedAt: new Date().toISOString()
      });
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
      endTime: event.endTime || '',
      type: event.type,
      location: event.location || '',
      priority: event.priority,
      affectedUsers: event.affectedUsers || []
    });
    setIsAddDialogOpen(true);
  };

  const resetEventForm = () => {
    setSelectedEvent(null);
    setEventFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      type: 'event',
      location: '',
      priority: 'medium',
      affectedUsers: []
    });
  };

  const resetScheduleForm = () => {
    setSelectedSchedule(null);
    setScheduleFormData({
      classId: '',
      className: '',
      teacherId: '',
      teacherName: '',
      subject: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: '',
      room: '',
      effectiveFrom: '',
      effectiveTo: '',
      isActive: true
    });
  };

  const resetChangeForm = () => {
    setChangeFormData({
      originalScheduleId: '',
      changeType: 'cancelled',
      originalDate: '',
      newDate: '',
      originalTime: '',
      newTime: '',
      originalRoom: '',
      newRoom: '',
      reason: '',
      affectedUsers: []
    });
  };

  const handleQuickAction = (type: CalendarEvent['type']) => {
    resetEventForm();
    setEventFormData(prev => ({ ...prev, type }));
    setIsAddDialogOpen(true);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Academic Calendar & Scheduling"
      pageDescription="Manage academic events, class schedules, and important dates"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Calendar Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {schedules.length}
              </div>
              <p className="text-sm text-muted-foreground">Class Schedules</p>
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
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {scheduleChanges.length}
              </div>
              <p className="text-sm text-muted-foreground">Schedule Changes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar Interface */}
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  Academic Calendar & Scheduling
                </CardTitle>
                <CardDescription>
                  Manage events, class schedules, and schedule changes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="calendar">Calendar Events</TabsTrigger>
                <TabsTrigger value="schedules">Class Schedules</TabsTrigger>
                <TabsTrigger value="changes">Schedule Changes</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>

              {/* Calendar Events Tab */}
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Academic Calendar Events</h3>
                  <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) resetEventForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white shadow-md"
                        onClick={() => resetEventForm()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
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
                        resetEventForm();
                        setIsAddDialogOpen(false);
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-3 gap-4">
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
                            <Label htmlFor="time">Start Time</Label>
                            <Input
                              id="time"
                              type="time"
                              value={eventFormData.time}
                              onChange={(e) => setEventFormData(prev => ({ ...prev, time: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={eventFormData.endTime}
                              onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              placeholder="Enter location"
                              value={eventFormData.location}
                              onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                              value={eventFormData.priority}
                              onValueChange={(value) => setEventFormData(prev => ({ ...prev, priority: value as CalendarEvent['priority'] }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notify Users</Label>
                          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                            {users.map(user => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={user.id}
                                  checked={eventFormData.affectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEventFormData(prev => ({
                                        ...prev,
                                        affectedUsers: [...prev.affectedUsers, user.id]
                                      }));
                                    } else {
                                      setEventFormData(prev => ({
                                        ...prev,
                                        affectedUsers: prev.affectedUsers.filter(id => id !== user.id)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={user.id} className="text-sm">
                                  {user.displayName} ({user.role})
                                </Label>
                              </div>
                            ))}
                          </div>
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
                                <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", getPriorityColor(event.priority))}>
                                  {event.priority}
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
                                  {event.time} {event.endTime && `- ${event.endTime}`}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                    {event.location}
                                  </div>
                                )}
                                {event.affectedUsers && event.affectedUsers.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <Bell className="h-3.5 w-3.5 text-primary/70" />
                                    {event.affectedUsers.length} notified
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
              </TabsContent>

              {/* Class Schedules Tab */}
              <TabsContent value="schedules" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Class Schedules</h3>
                  <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
                    setIsScheduleDialogOpen(open);
                    if (!open) resetScheduleForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white shadow-md"
                        onClick={() => resetScheduleForm()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Class Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Class Schedule</DialogTitle>
                        <DialogDescription>
                          Create a recurring class schedule that will appear on teacher and student dashboards
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        await addSchedule(scheduleFormData);
                        resetScheduleForm();
                        setIsScheduleDialogOpen(false);
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="classId">Class</Label>
                            <Select
                              value={scheduleFormData.classId}
                              onValueChange={(value) => {
                                const selectedClass = classes.find(c => c.id === value);
                                setScheduleFormData(prev => ({ 
                                  ...prev, 
                                  classId: value,
                                  subject: selectedClass?.name || ''
                                }));
                              }}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {classes.map(cls => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name} - {cls.teacher}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dayOfWeek">Day of Week</Label>
                            <Select
                              value={scheduleFormData.dayOfWeek.toString()}
                              onValueChange={(value) => setScheduleFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Monday</SelectItem>
                                <SelectItem value="2">Tuesday</SelectItem>
                                <SelectItem value="3">Wednesday</SelectItem>
                                <SelectItem value="4">Thursday</SelectItem>
                                <SelectItem value="5">Friday</SelectItem>
                                <SelectItem value="6">Saturday</SelectItem>
                                <SelectItem value="0">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={scheduleFormData.startTime}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, startTime: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={scheduleFormData.endTime}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, endTime: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="room">Room</Label>
                            <Input
                              id="room"
                              placeholder="e.g., Room 101"
                              value={scheduleFormData.room}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, room: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="effectiveFrom">Effective From</Label>
                            <Input
                              id="effectiveFrom"
                              type="date"
                              value={scheduleFormData.effectiveFrom}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
                            <Input
                              id="effectiveTo"
                              type="date"
                              value={scheduleFormData.effectiveTo}
                              onChange={(e) => setScheduleFormData(prev => ({ ...prev, effectiveTo: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">
                            Add Schedule
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading schedules...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No class schedules</p>
                        <p className="text-sm text-muted-foreground/60">Add your first class schedule to get started</p>
                      </div>
                    ) : (
                      schedules.map((schedule) => (
                        <div key={schedule.id} className="group flex items-center justify-between p-5 border rounded-xl hover:bg-accent/30 transition-all duration-200">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                              <BookOpen className="h-7 w-7 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="font-bold text-lg">{schedule.className}</h3>
                                <Badge className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-800">
                                  {getDayName(schedule.dayOfWeek)}
                                </Badge>
                                {schedule.isActive && (
                                  <Badge className="text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Teacher: {schedule.teacherName} | Subject: {schedule.subject}
                              </p>
                              <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground/80">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                  {schedule.room}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                  From {new Date(schedule.effectiveFrom).toLocaleDateString()}
                                  {schedule.effectiveTo && ` to ${new Date(schedule.effectiveTo).toLocaleDateString()}`}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this schedule?')) {
                                  try {
                                    await updateCalendarEvent(schedule.id, { status: 'cancelled' });
                                    toast.success("Schedule deleted successfully");
                                  } catch (error) {
                                    toast.error("Failed to delete schedule");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Schedule Changes Tab */}
              <TabsContent value="changes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Schedule Changes & Notifications</h3>
                  <Dialog open={isChangeDialogOpen} onOpenChange={(open) => {
                    setIsChangeDialogOpen(open);
                    if (!open) resetChangeForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white shadow-md"
                        onClick={() => resetChangeForm()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Schedule Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Schedule Change</DialogTitle>
                        <DialogDescription>
                          Notify teachers and students about schedule changes. Changes will automatically appear on their dashboards.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        await createChange(changeFormData);
                        resetChangeForm();
                        setIsChangeDialogOpen(false);
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="originalScheduleId">Original Schedule</Label>
                            <Select
                              value={changeFormData.originalScheduleId}
                              onValueChange={(value) => setChangeFormData(prev => ({ ...prev, originalScheduleId: value }))}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule" />
                              </SelectTrigger>
                              <SelectContent>
                                {schedules.map(schedule => (
                                  <SelectItem key={schedule.id} value={schedule.id}>
                                    {schedule.className} - {getDayName(schedule.dayOfWeek)} {schedule.startTime}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="changeType">Change Type</Label>
                            <Select
                              value={changeFormData.changeType}
                              onValueChange={(value) => setChangeFormData(prev => ({ ...prev, changeType: value as ScheduleChange['changeType'] }))}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                <SelectItem value="room_change">Room Change</SelectItem>
                                <SelectItem value="teacher_change">Teacher Change</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="originalDate">Original Date</Label>
                            <Input
                              id="originalDate"
                              type="date"
                              value={changeFormData.originalDate}
                              onChange={(e) => setChangeFormData(prev => ({ ...prev, originalDate: e.target.value }))}
                              required
                            />
                          </div>
                          {changeFormData.changeType === 'rescheduled' && (
                            <div className="space-y-2">
                              <Label htmlFor="newDate">New Date</Label>
                              <Input
                                id="newDate"
                                type="date"
                                value={changeFormData.newDate}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, newDate: e.target.value }))}
                              />
                            </div>
                          )}
                        </div>
                        {changeFormData.changeType === 'rescheduled' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="originalTime">Original Time</Label>
                              <Input
                                id="originalTime"
                                type="time"
                                value={changeFormData.originalTime}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, originalTime: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newTime">New Time</Label>
                              <Input
                                id="newTime"
                                type="time"
                                value={changeFormData.newTime}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, newTime: e.target.value }))}
                              />
                            </div>
                          </div>
                        )}
                        {changeFormData.changeType === 'room_change' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="originalRoom">Original Room</Label>
                              <Input
                                id="originalRoom"
                                placeholder="e.g., Room 101"
                                value={changeFormData.originalRoom}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, originalRoom: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newRoom">New Room</Label>
                              <Input
                                id="newRoom"
                                placeholder="e.g., Room 202"
                                value={changeFormData.newRoom}
                                onChange={(e) => setChangeFormData(prev => ({ ...prev, newRoom: e.target.value }))}
                              />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Change</Label>
                          <Textarea
                            id="reason"
                            placeholder="Explain the reason for this schedule change..."
                            value={changeFormData.reason}
                            onChange={(e) => setChangeFormData(prev => ({ ...prev, reason: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Notify Users</Label>
                          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                            {users.map(user => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`change-${user.id}`}
                                  checked={changeFormData.affectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setChangeFormData(prev => ({
                                        ...prev,
                                        affectedUsers: [...prev.affectedUsers, user.id]
                                      }));
                                    } else {
                                      setChangeFormData(prev => ({
                                        ...prev,
                                        affectedUsers: prev.affectedUsers.filter(id => id !== user.id)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={`change-${user.id}`} className="text-sm">
                                  {user.displayName} ({user.role})
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">
                            Create Change & Notify
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsChangeDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading schedule changes...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduleChanges.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No schedule changes</p>
                        <p className="text-sm text-muted-foreground/60">Create a schedule change to notify users</p>
                      </div>
                    ) : (
                      scheduleChanges.map((change) => {
                        const getChangeTypeColor = (type: string) => {
                          switch (type) {
                            case 'cancelled': return 'bg-red-100 text-red-800';
                            case 'rescheduled': return 'bg-orange-100 text-orange-800';
                            case 'room_change': return 'bg-blue-100 text-blue-800';
                            case 'teacher_change': return 'bg-purple-100 text-purple-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };

                        return (
                          <div key={change.id} className="group flex items-center justify-between p-5 border rounded-xl hover:bg-accent/30 transition-all duration-200">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                <AlertTriangle className="h-7 w-7 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <h3 className="font-bold text-lg">Schedule Change</h3>
                                  <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", getChangeTypeColor(change.changeType))}>
                                    {change.changeType.replace('_', ' ')}
                                  </Badge>
                                  {change.notificationSent && (
                                    <Badge className="text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-800">
                                      <Bell className="h-3 w-3 mr-1" />
                                      Notified
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{change.reason}</p>
                                <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground/80">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                    {new Date(change.originalDate).toLocaleDateString()}
                                    {change.newDate && ` → ${new Date(change.newDate).toLocaleDateString()}`}
                                  </div>
                                  {change.originalTime && change.newTime && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-primary/70" />
                                      {change.originalTime} → {change.newTime}
                                    </div>
                                  )}
                                  {change.originalRoom && change.newRoom && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-primary/70" />
                                      {change.originalRoom} → {change.newRoom}
                                    </div>
                                  )}
                                  {change.affectedUsers && change.affectedUsers.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-3.5 w-3.5 text-primary/70" />
                                      {change.affectedUsers.length} users notified
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}