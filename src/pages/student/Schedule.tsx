import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface ClassSchedule {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  duration: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam';
  day: string;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const mockSchedule: ClassSchedule[] = [
  {
    id: '1',
    subject: 'Mathematics',
    teacher: 'Dr. Smith',
    time: '09:00 AM',
    duration: '1h 30m',
    room: 'Room 101',
    type: 'lecture',
    day: 'Monday'
  },
  {
    id: '2',
    subject: 'Physics Lab',
    teacher: 'Prof. Johnson',
    time: '11:00 AM',
    duration: '2h',
    room: 'Lab 201',
    type: 'lab',
    day: 'Monday'
  },
  {
    id: '3',
    subject: 'English Literature',
    teacher: 'Ms. Davis',
    time: '02:00 PM',
    duration: '1h',
    room: 'Room 305',
    type: 'lecture',
    day: 'Monday'
  },
  {
    id: '4',
    subject: 'Chemistry',
    teacher: 'Dr. Brown',
    time: '09:00 AM',
    duration: '1h 30m',
    room: 'Room 102',
    type: 'lecture',
    day: 'Tuesday'
  },
  {
    id: '5',
    subject: 'History',
    teacher: 'Mr. Wilson',
    time: '11:00 AM',
    duration: '1h',
    room: 'Room 203',
    type: 'lecture',
    day: 'Tuesday'
  },
  {
    id: '6',
    subject: 'Mathematics Tutorial',
    teacher: 'Dr. Smith',
    time: '02:00 PM',
    duration: '1h',
    room: 'Room 101',
    type: 'tutorial',
    day: 'Tuesday'
  },
  {
    id: '7',
    subject: 'Physics',
    teacher: 'Prof. Johnson',
    time: '09:00 AM',
    duration: '1h 30m',
    room: 'Room 204',
    type: 'lecture',
    day: 'Wednesday'
  },
  {
    id: '8',
    subject: 'Chemistry Lab',
    teacher: 'Dr. Brown',
    time: '11:00 AM',
    duration: '2h',
    room: 'Lab 301',
    type: 'lab',
    day: 'Wednesday'
  },
  {
    id: '9',
    subject: 'English Literature',
    teacher: 'Ms. Davis',
    time: '09:00 AM',
    duration: '1h',
    room: 'Room 305',
    type: 'lecture',
    day: 'Thursday'
  },
  {
    id: '10',
    subject: 'History',
    teacher: 'Mr. Wilson',
    time: '11:00 AM',
    duration: '1h',
    room: 'Room 203',
    type: 'lecture',
    day: 'Thursday'
  },
  {
    id: '11',
    subject: 'Mathematics',
    teacher: 'Dr. Smith',
    time: '02:00 PM',
    duration: '1h 30m',
    room: 'Room 101',
    type: 'lecture',
    day: 'Thursday'
  },
  {
    id: '12',
    subject: 'Physics',
    teacher: 'Prof. Johnson',
    time: '09:00 AM',
    duration: '1h 30m',
    room: 'Room 204',
    type: 'lecture',
    day: 'Friday'
  },
  {
    id: '13',
    subject: 'Chemistry',
    teacher: 'Dr. Brown',
    time: '11:00 AM',
    duration: '1h 30m',
    room: 'Room 102',
    type: 'lecture',
    day: 'Friday'
  }
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Mathematics Mid-term Exam',
    date: '2024-01-25',
    time: '10:00 AM',
    room: 'Exam Hall A',
    type: 'exam'
  },
  {
    id: '2',
    title: 'Physics Project Submission',
    date: '2024-01-28',
    time: '11:59 PM',
    room: 'Online Portal',
    type: 'assignment'
  },
  {
    id: '3',
    title: 'Chemistry Lab Quiz',
    date: '2024-01-30',
    time: '02:00 PM',
    room: 'Lab 301',
    type: 'quiz'
  }
];

export default function StudentSchedule() {
  const [currentWeek, setCurrentWeek] = useState(0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab': return 'bg-green-100 text-green-800 border-green-200';
      case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScheduleForDay = (day: string) => {
    return mockSchedule
      .filter(item => item.day === day)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (currentWeek * 7));
    
    return weekDays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date
      };
    });
  };

  const weekDates = getCurrentWeekDates();

  return (
    <DashboardLayout
      role="student"
      pageTitle="My Schedule"
      pageDescription="View your class schedule and upcoming events"
    >
      <div className="space-y-6">
        <UserProfile />
        
        {/* Header with Week Navigation */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">My Schedule</h2>
            <p className="text-muted-foreground">Your weekly class schedule and upcoming events</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(currentWeek - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-4">
              Week of {weekDates[0].date}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(currentWeek + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {weekDates.map(({ day, date }) => (
            <Card key={day} className="min-h-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{day}</CardTitle>
                <CardDescription>{date}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getScheduleForDay(day).map((classItem) => (
                  <div key={classItem.id} className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getTypeColor(classItem.type)}>
                        {classItem.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{classItem.duration}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{classItem.subject}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {classItem.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {classItem.room}
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {classItem.teacher}
                      </div>
                    </div>
                  </div>
                ))}
                {getScheduleForDay(day).length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No classes scheduled
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Today's Classes
              </CardTitle>
              <CardDescription>
                Your classes for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getScheduleForDay('Monday').map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{classItem.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        {classItem.time} • {classItem.room} • {classItem.teacher}
                      </p>
                    </div>
                    <Badge className={getTypeColor(classItem.type)}>
                      {classItem.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
              <CardDescription>
                Important dates and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.date)} • {event.time} • {event.room}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>
              Overview of your weekly schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {mockSchedule.filter(c => c.type === 'lecture').length}
                </div>
                <p className="text-sm text-muted-foreground">Lectures</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mockSchedule.filter(c => c.type === 'lab').length}
                </div>
                <p className="text-sm text-muted-foreground">Lab Sessions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {mockSchedule.filter(c => c.type === 'tutorial').length}
                </div>
                <p className="text-sm text-muted-foreground">Tutorials</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {upcomingEvents.length}
                </div>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}