import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Users, Eye, Edit, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTeacherClasses, getClassStats, type Class } from "@/lib/classUtils";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function TeacherClasses() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestClassOpen, setIsRequestClassOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestData, setRequestData] = useState({
    name: '',
    subject: '',
    grade: '',
    room: '',
    maxStudents: ''
  });

  // Fetch users and teacher's classes from Firebase
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

        // Fetch classes assigned to this teacher using utility function
        if (userData?.userId) {
          const classesData = await fetchTeacherClasses(userData.userId);
          setClasses(classesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  const handleRequestClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestData.name || !requestData.subject) {
      alert('Please fill in required fields (Name and Subject)');
      return;
    }

    if (!userData) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    if (!userData.userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    setRequesting(true);
    try {
      const classRequest = {
        name: requestData.name,
        subject: requestData.subject,
        grade: requestData.grade || 'All',
        teacher: userData.displayName || 'Unknown',
        teacherId: userData.userId,
        room: requestData.room || 'TBD',
        maxStudents: parseInt(requestData.maxStudents) || 30,
        students: 0,
        schedule: "To be scheduled",
        status: 'pending' as const,
        requestedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'classes'), classRequest);
      
      // Add to local state
      const localClass = {
        id: docRef.id,
        ...classRequest
      };
      
      setClasses(prev => [localClass, ...prev]);
      setRequestData({ name: '', subject: '', grade: '', room: '', maxStudents: '' });
      setIsRequestClassOpen(false);
      alert('Class request submitted successfully! Waiting for admin approval.');
      
    } catch (error) {
      console.error('Error requesting class:', error);
      alert(`Failed to submit class request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRequesting(false);
    }
  };

  const students = users.filter(u => u.role === 'student');
  const stats = getClassStats(classes);

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="My Classes"
      pageDescription="View and manage your assigned classes"
    >
      <div className="space-y-6">
        <UserProfile />
        
        {!userData ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">
                Please log in as a teacher to access this page.
              </p>
            </CardContent>
          </Card>
        ) : userData.role !== 'teacher' ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-orange-600 mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                This page is only accessible to teachers. Your role: {userData.role}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Assigned Classes ({classes.length})
              </CardTitle>
              <Dialog open={isRequestClassOpen} onOpenChange={setIsRequestClassOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Request New Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request New Class</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRequestClass} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="requestClassName">Class Name *</Label>
                      <Input 
                        id="requestClassName" 
                        placeholder="e.g., Advanced Physics Grade 12"
                        value={requestData.name}
                        onChange={(e) => setRequestData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requestSubject">Subject *</Label>
                      <Input 
                        id="requestSubject" 
                        placeholder="e.g., Physics"
                        value={requestData.subject}
                        onChange={(e) => setRequestData(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="requestGrade">Grade</Label>
                        <Select value={requestData.grade} onValueChange={(value) => setRequestData(prev => ({ ...prev, grade: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9">Grade 9</SelectItem>
                            <SelectItem value="10">Grade 10</SelectItem>
                            <SelectItem value="11">Grade 11</SelectItem>
                            <SelectItem value="12">Grade 12</SelectItem>
                            <SelectItem value="All">All Grades</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestRoom">Preferred Room</Label>
                        <Input 
                          id="requestRoom" 
                          placeholder="Room 101"
                          value={requestData.room}
                          onChange={(e) => setRequestData(prev => ({ ...prev, room: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requestMaxStudents">Max Students</Label>
                      <Input 
                        id="requestMaxStudents" 
                        type="number" 
                        placeholder="30"
                        value={requestData.maxStudents}
                        onChange={(e) => setRequestData(prev => ({ ...prev, maxStudents: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={requesting || !userData}>
                        {requesting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsRequestClassOpen(false)}>
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
                  <p className="text-muted-foreground">Loading classes...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                      <p className="text-sm text-muted-foreground">Pending Approval</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Classes Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {classes.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes assigned</p>
                      <p className="text-sm text-muted-foreground">Contact admin to get classes assigned</p>
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <Card key={cls.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{cls.name}</h3>
                              <p className="text-muted-foreground">{cls.subject} • Grade {cls.grade}</p>
                            </div>
                            <Badge variant={cls.status === "active" ? "default" : cls.status === "pending" ? "secondary" : "outline"}>
                              {cls.status === "pending" ? "Pending Approval" : `${cls.students} students`}
                            </Badge>
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
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {cls.students} students enrolled
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
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                {classes.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Button variant="outline" className="justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Take Attendance
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Students
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Clock className="h-4 w-4 mr-2" />
                        Class Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  );
}