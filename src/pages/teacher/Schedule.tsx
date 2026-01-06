import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Edit, Plus, Users, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

interface ClassSchedule {
  id: string;
  name: string;
  subject: string;
  grade: string;
  students: number;
  schedule: string;
  room: string;
  status: string;
}

export default function TeacherSchedule() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Generate classes based on real data - empty until proper class assignment system
  const students = users.filter(u => u.role === 'student');
  
  const classes: ClassSchedule[] = students.length > 0 ? [
    {
      id: "1",
      name: "Sample Class",
      subject: "General",
      grade: "All",
      students: students.length,
      schedule: "To be scheduled",
      room: "TBD",
      status: "active"
    }
  ] : [];

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Class Schedule"
      pageDescription="View and manage your class schedules"
    >
      <div className="space-y-6">
        <UserProfile />
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Class Schedule
              </CardTitle>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading schedule...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Schedule Overview */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {classes.reduce((acc, cls) => acc + cls.students, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {classes.filter(cls => cls.status === 'active').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Class Schedule List */}
                <div className="space-y-4">
                  {classes.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes scheduled</p>
                      <p className="text-sm text-muted-foreground">Contact admin to get classes assigned</p>
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{cls.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {cls.schedule}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {cls.room}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cls.students} students
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cls.status === "active" ? "default" : "secondary"}>
                            {cls.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            View Calendar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Weekly Schedule View */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Weekly Schedule</h3>
                  <div className="grid gap-4 md:grid-cols-5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <div key={day} className="space-y-2">
                        <h4 className="font-medium text-center">{day}</h4>
                        <div className="space-y-1">
                          {classes
                            .filter(cls => cls.schedule.toLowerCase().includes(day.toLowerCase().slice(0, 3)))
                            .map((cls) => (
                              <div key={`${day}-${cls.id}`} className="p-2 border rounded text-xs">
                                <div className="font-medium">{cls.subject}</div>
                                <div className="text-muted-foreground">
                                  {cls.schedule.split(' - ')[1]} • {cls.room}
                                </div>
                              </div>
                            ))}
                          {classes.filter(cls => cls.schedule.toLowerCase().includes(day.toLowerCase().slice(0, 3))).length === 0 && (
                            <div className="text-center p-2 text-xs text-muted-foreground">
                              No classes
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                {classes.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
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
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}