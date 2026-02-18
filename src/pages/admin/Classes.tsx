import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Clock,
  Calendar,
  UserPlus,
  UserMinus,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  BarChart3,
  GraduationCap,
  UserCheck,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  fetchAllClasses,
  createClass,
  approveClassRequest,
  rejectClassRequest,
  getClassStats,
  type Class,
  type ClassFormData,
  enrollStudentInClass,
  getStudentsForClass,
  getAvailableStudentsForClass,
  unenrollStudent,
  updateClass,
  type StudentInfo
} from "@/lib/classUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function AdminClasses() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedClassForEnrollment, setSelectedClassForEnrollment] = useState<string>("");
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);

  // View Details State
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<Class | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentInfo[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Schedule Management State
  const [editScheduleOpen, setEditScheduleOpen] = useState(false);
  const [selectedClassForSchedule, setSelectedClassForSchedule] = useState<Class | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    schedule: '',
    room: '',
    startTime: '',
    endTime: '',
    days: [] as string[]
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    subject: '',
    teacher: '',
    grade: '',
    section: '',
    room: '',
    maxStudents: ''
  });

  // Fetch users and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          userId: doc.data().userId || 'N/A',
          displayName: doc.data().displayName || 'Unknown',
          email: doc.data().email || 'No email',
          role: doc.data().role || 'student',
          status: doc.data().status || 'active',
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : 'Unknown'
        } as User));
        setUsers(usersData);
        setAvailableStudents(usersData.filter(u => u.role === 'student'));

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

  // Update available students when class selection changes
  useEffect(() => {
    const fetchAvailable = async () => {
      if (selectedClassForEnrollment) {
        try {
          const available = await getAvailableStudentsForClass(selectedClassForEnrollment);
          // Map back to User type (simplified for now as fields match mostly)
          const availableUsers = available.map(s => users.find(u => u.id === s.id)!).filter(Boolean);
          setAvailableStudents(availableUsers);
        } catch (error) {
          console.error("Error fetching available students", error);
        }
      } else {
        setAvailableStudents(users.filter(u => u.role === 'student'));
      }
    };
    fetchAvailable();
  }, [selectedClassForEnrollment, users]);

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.teacher) {
      toast.error('Please fill in required fields');
      return;
    }

    setCreating(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacher);
      if (!selectedTeacher) return;

      const newClassData = {
        name: formData.name,
        subject: formData.subject,
        grade: formData.grade || 'All',
        section: formData.section || '',
        teacher: selectedTeacher.displayName,
        teacherId: selectedTeacher.userId,
        room: formData.room || 'TBD',
        maxStudents: parseInt(formData.maxStudents) || 30,
        students: 0,
        schedule: "To be scheduled",
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };

      const classId = await createClass(newClassData);
      const localClass = { id: classId, ...newClassData };

      setClasses(prev => [localClass, ...prev]);
      setFormData({ name: '', subject: '', teacher: '', grade: '', section: '', room: '', maxStudents: '' });
      setIsAddClassOpen(false);
      toast.success('Class created successfully!');
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveClass = async (classId: string) => {
    try {
      await approveClassRequest(classId);
      setClasses(prev => prev.map(cls => cls.id === classId ? { ...cls, status: 'active' as const } : cls));
      toast.success('Class approved');
    } catch (error) {
      console.error('Error approving class:', error);
      toast.error('Failed to approve');
    }
  };

  const handleRejectClass = async (classId: string) => {
    if (!confirm('Reject this class request?')) return;
    try {
      await rejectClassRequest(classId);
      setClasses(prev => prev.filter(cls => cls.id !== classId));
      toast.success('Class rejected');
    } catch (error) {
      console.error('Error rejecting class:', error);
      toast.error('Failed to reject');
    }
  };

  const handleEnrollStudent = async (studentId: string, studentUserId: string, studentName: string) => {
    if (!selectedClassForEnrollment) {
      toast.error('Please select a class first');
      return;
    }

    try {
      setEnrolling(studentId);
      await enrollStudentInClass(selectedClassForEnrollment, studentId, studentUserId, studentName);

      setClasses(prev => prev.map(cls => cls.id === selectedClassForEnrollment ? { ...cls, students: cls.students + 1 } : cls));

      // Update available list immediately
      setAvailableStudents(prev => prev.filter(s => s.id !== studentId));

      toast.success(`Enrolled ${studentName}`);
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Failed to enroll student');
    } finally {
      setEnrolling(null);
    }
  };

  const handleViewDetails = async (cls: Class) => {
    setSelectedClassDetails(cls);
    setViewDetailsOpen(true);
    setLoadingDetails(true);
    try {
      const students = await getStudentsForClass(cls.id);
      setEnrolledStudents(students);

      // Lazy Repair: Check if count matches
      if (students.length !== cls.students) {
        console.log(`Lazy repairing class ${cls.name}: ${cls.students} -> ${students.length}`);
        await updateClass(cls.id, { students: students.length });

        // Update local state immediately
        setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, students: students.length } : c));

        // Provide subtle feedback
        toast.info("Class statistics updated");
      }
    } catch (error) {
      console.error("Error fetching class details", error);
      toast.error("Failed to load students");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    if (!selectedClassDetails) return;
    if (!confirm("Are you sure you want to unenroll this student?")) return;

    try {
      await unenrollStudent(selectedClassDetails.id, studentId);
      setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
      setClasses(prev => prev.map(c => c.id === selectedClassDetails.id ? { ...c, students: c.students - 1 } : c));
      toast.success("Student unenrolled");
    } catch (error) {
      console.error("Error unenrolling", error);
      toast.error("Failed to unenroll student");
    }
  };

  const handleEditSchedule = (cls: Class) => {
    setSelectedClassForSchedule(cls);
    // Parse existing schedule if it exists
    const scheduleText = cls.schedule || '';
    setScheduleFormData({
      schedule: scheduleText,
      room: cls.room || '',
      startTime: '',
      endTime: '',
      days: []
    });
    setEditScheduleOpen(true);
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForSchedule) return;

    setUpdatingSchedule(true);
    try {
      const scheduleText = scheduleFormData.days.length > 0 && scheduleFormData.startTime && scheduleFormData.endTime
        ? `${scheduleFormData.days.join(', ')} ${scheduleFormData.startTime} - ${scheduleFormData.endTime}`
        : scheduleFormData.schedule || 'To be scheduled';

      const updates = {
        schedule: scheduleText,
        room: scheduleFormData.room || 'TBD'
      };

      await updateClass(selectedClassForSchedule.id, updates);

      // Update local state
      setClasses(prev => prev.map(cls => 
        cls.id === selectedClassForSchedule.id 
          ? { ...cls, ...updates }
          : cls
      ));

      setEditScheduleOpen(false);
      toast.success('Schedule updated successfully!');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const handleViewCalendar = (cls: Class) => {
    // For now, show a simple alert with class schedule info
    // In a real implementation, this could open a calendar view or navigate to a calendar page
    toast.info(`Calendar view for ${cls.name}`, {
      description: `Schedule: ${cls.schedule} | Room: ${cls.room}`,
      duration: 5000
    });
  };

  const handleAddSchedule = () => {
    // Open the edit schedule dialog without a selected class
    setSelectedClassForSchedule(null);
    setScheduleFormData({
      schedule: '',
      room: '',
      startTime: '',
      endTime: '',
      days: []
    });
    toast.info("Add Schedule functionality", {
      description: "This would typically open a form to create a new schedule or time slot.",
      duration: 3000
    });
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || cls.grade === gradeFilter;
    const matchesStatus = statusFilter === "all" || cls.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const stats = getClassStats(classes);

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Class Management"
      pageDescription="Manage classes, subjects, and enrollments"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Classes Management Overview */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Classes Management Center
            </CardTitle>
            <p className="text-muted-foreground">
              Comprehensive class management with integrated navigation to attendance, schedules, and dashboards
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Create Classes</div>
                    <div className="text-sm text-muted-foreground">Add new classes with teachers</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  • Assign teachers • Set grade/section • Configure room & capacity
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Manage Students</div>
                    <div className="text-sm text-muted-foreground">Enroll & remove students</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  • Add/remove students • View enrollment status • Manage capacity
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Auto-Navigation</div>
                    <div className="text-sm text-muted-foreground">Quick access to all features</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  • Attendance records • Class schedules • Teacher/Student dashboards
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Analytics</div>
                    <div className="text-sm text-muted-foreground">Class performance insights</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  • Attendance reports • Class statistics • Performance tracking
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all-classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-classes">All Classes</TabsTrigger>
            <TabsTrigger value="add-class">Add Class</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* All Classes Tab */}
          <TabsContent value="all-classes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    All Classes ({filteredClasses.length})
                  </CardTitle>
                  <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateClass} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="className">Class Name *</Label>
                          <Input
                            id="className"
                            placeholder="e.g., Mathematics Grade 10"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            placeholder="e.g., Mathematics"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacher">Assign Teacher *</Label>
                          <Select value={formData.teacher} onValueChange={(value) => setFormData(prev => ({ ...prev, teacher: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.displayName} ({teacher.userId})
                                </SelectItem>
                              ))}
                              {teachers.length === 0 && (
                                <SelectItem value="none" disabled>No teachers available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
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
                            <Label htmlFor="room">Room</Label>
                            <Input
                              id="room"
                              placeholder="Room 101"
                              value={formData.room}
                              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1" disabled={creating}>
                            {creating ? 'Creating...' : 'Create Class'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddClassOpen(false)}>
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
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search classes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Grades</SelectItem>
                          <SelectItem value="9">Grade 9</SelectItem>
                          <SelectItem value="10">Grade 10</SelectItem>
                          <SelectItem value="11">Grade 11</SelectItem>
                          <SelectItem value="12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                          <p className="text-sm text-muted-foreground">Total Classes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                          <p className="text-sm text-muted-foreground">Active Classes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                          <p className="text-sm text-muted-foreground">Pending Approval</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{stats.totalStudents}</div>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Classes Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredClasses.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No classes found</p>
                          <p className="text-sm text-muted-foreground">Create your first class to get started</p>
                        </div>
                      ) : (
                        filteredClasses.map((cls) => (
                          <Card key={cls.id} className={`border-l-4 ${cls.status === 'pending' ? 'border-l-orange-500' : 'border-l-primary'}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                                  <p className="text-muted-foreground">
                                    {cls.subject} • Grade {cls.grade}
                                    {cls.section && ` • Section ${cls.section}`}
                                  </p>
                                </div>
                                <Badge variant={
                                  cls.status === "active" ? "default" :
                                    cls.status === "pending" ? "secondary" :
                                      "outline"
                                }>
                                  {cls.status === "pending" ? "Pending" : cls.status}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Teacher: {cls.teacher}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {cls.students} / {cls.maxStudents} students
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {cls.schedule}
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  {cls.room}
                                </div>
                              </div>

                              {/* Quick Navigation Links */}
                              {cls.status === 'active' && (
                                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Quick Access</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <Link 
                                      to={`/admin/attendance?classId=${cls.id}`}
                                      className="flex items-center gap-1 p-2 rounded bg-background hover:bg-primary/10 transition-colors"
                                    >
                                      <UserCheck className="h-3 w-3" />
                                      <span>Attendance</span>
                                      <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Link>
                                    <Link 
                                      to={`/admin/calendar?classId=${cls.id}`}
                                      className="flex items-center gap-1 p-2 rounded bg-background hover:bg-primary/10 transition-colors"
                                    >
                                      <Calendar className="h-3 w-3" />
                                      <span>Schedule</span>
                                      <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Link>
                                    <Link 
                                      to={`/teacher?teacherId=${cls.teacherId}`}
                                      className="flex items-center gap-1 p-2 rounded bg-background hover:bg-primary/10 transition-colors"
                                    >
                                      <GraduationCap className="h-3 w-3" />
                                      <span>Teacher</span>
                                      <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Link>
                                    <Link 
                                      to={`/admin/reports?classId=${cls.id}`}
                                      className="flex items-center gap-1 p-2 rounded bg-background hover:bg-primary/10 transition-colors"
                                    >
                                      <BarChart3 className="h-3 w-3" />
                                      <span>Reports</span>
                                      <ExternalLink className="h-3 w-3 ml-auto" />
                                    </Link>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                {cls.status === 'pending' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="flex-1"
                                      onClick={() => handleApproveClass(cls.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectClass(cls.id)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleViewDetails(cls)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Manage Students
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleEditSchedule(cls)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Class Tab */}
          <TabsContent value="add-class" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Class</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClass} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullClassName">Class Name *</Label>
                        <Input
                          id="fullClassName"
                          placeholder="e.g., Advanced Mathematics Grade 12"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subjectName">Subject *</Label>
                        <Input
                          id="subjectName"
                          placeholder="e.g., Mathematics"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select value={formData.grade} onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
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
                        <Label htmlFor="section">Section</Label>
                        <Input
                          id="section"
                          placeholder="e.g., A, B, Advanced"
                          value={formData.section}
                          onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignTeacher">Assign Teacher *</Label>
                        <Select value={formData.teacher} onValueChange={(value) => setFormData(prev => ({ ...prev, teacher: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.displayName} ({teacher.userId})
                              </SelectItem>
                            ))}
                            {teachers.length === 0 && (
                              <SelectItem value="none" disabled>No teachers available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classRoom">Classroom</Label>
                        <Input
                          id="classRoom"
                          placeholder="e.g., Room 101, Lab 201"
                          value={formData.room}
                          onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxStudents">Maximum Students</Label>
                        <Input
                          id="maxStudents"
                          type="number"
                          placeholder="30"
                          value={formData.maxStudents}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Class'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setFormData({ name: '', subject: '', teacher: '', grade: '', section: '', room: '', maxStudents: '' })}>
                      Clear Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{students.length}</div>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                        <p className="text-sm text-muted-foreground">Active Classes</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {classes.reduce((acc, cls) => acc + cls.students, 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {selectedClassForEnrollment
                          ? `Available Students for ${classes.find(c => c.id === selectedClassForEnrollment)?.name}`
                          : "Select a Class to Enroll Students"
                        }
                      </h3>
                      <div className="w-64">
                        <Label htmlFor="class-select" className="text-sm font-medium">Select Class for Enrollment</Label>
                        <Select value={selectedClassForEnrollment} onValueChange={setSelectedClassForEnrollment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a class..." />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.filter(cls => cls.status === 'active').map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} - {cls.subject} 
                                {cls.section && ` (Section ${cls.section})`}
                                ({cls.students}/{cls.maxStudents} students)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {availableStudents.length === 0 ? (
                      <div className="text-center py-8">
                        {selectedClassForEnrollment ? (
                          <p className="text-muted-foreground">All students are already enrolled!</p>
                        ) : (
                          <p className="text-muted-foreground">Please select a class above to see available students.</p>
                        )}
                      </div>
                    ) : (
                      availableStudents.slice(0, 10).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.displayName}</p>
                              <p className="text-sm text-muted-foreground">{student.userId} • {student.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnrollStudent(student.id, student.userId, student.displayName)}
                              disabled={!selectedClassForEnrollment || enrolling === student.id}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {enrolling === student.id ? 'Enrolling...' : 'Enroll'}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Class Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">{cls.schedule}</p>
                        <p className="text-sm text-muted-foreground">{cls.room} • {cls.teacher}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditSchedule(cls)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Schedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCalendar(cls)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          View Calendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={handleAddSchedule}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Manage Students Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Students: {selectedClassDetails?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedClassDetails?.subject} • {selectedClassDetails?.schedule} • {selectedClassDetails?.room}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Class Navigation Links */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Class Management Links
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link 
                  to={`/admin/attendance?classId=${selectedClassDetails?.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border"
                >
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Attendance</div>
                    <div className="text-xs text-muted-foreground">View records</div>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
                <Link 
                  to={`/admin/calendar?classId=${selectedClassDetails?.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border"
                >
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Schedule</div>
                    <div className="text-xs text-muted-foreground">Class times</div>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
                <Link 
                  to={`/teacher?teacherId=${selectedClassDetails?.teacherId}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border"
                >
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium text-sm">Teacher</div>
                    <div className="text-xs text-muted-foreground">Dashboard</div>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
                <Link 
                  to={`/admin/reports?classId=${selectedClassDetails?.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border"
                >
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium text-sm">Reports</div>
                    <div className="text-xs text-muted-foreground">Analytics</div>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Student Management Section */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enrolled Students ({enrolledStudents.length}/{selectedClassDetails?.maxStudents})
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedClassDetails?.grade && `Grade ${selectedClassDetails.grade}`}
                </Badge>
                <Badge variant="secondary">
                  {selectedClassDetails?.subject}
                </Badge>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading students...</p>
                </div>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No students enrolled yet</p>
                <p className="text-sm text-muted-foreground">Use the Enrollments tab to add students to this class</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                {enrolledStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {student.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{student.displayName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>ID: {student.userId}</span>
                          <span>•</span>
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <Link 
                        to={`/student?studentId=${student.userId}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View Dashboard
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUnenroll(student.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDetailsOpen(false);
              // Switch to enrollments tab
              const enrollmentsTab = document.querySelector('[value="enrollments"]') as HTMLElement;
              enrollmentsTab?.click();
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={editScheduleOpen} onOpenChange={setEditScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule: {selectedClassForSchedule?.name}</DialogTitle>
            <DialogDescription>
              Update class schedule and room information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduleRoom">Room</Label>
                <Input
                  id="scheduleRoom"
                  placeholder="e.g., Room 101, Lab 201"
                  value={scheduleFormData.room}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, room: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customSchedule">Custom Schedule Text</Label>
                <Input
                  id="customSchedule"
                  placeholder="e.g., Mon-Fri 9:00 AM - 10:00 AM"
                  value={scheduleFormData.schedule}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, schedule: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Or Build Schedule:</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={scheduleFormData.startTime}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={scheduleFormData.endTime}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={scheduleFormData.days.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setScheduleFormData(prev => ({
                                ...prev,
                                days: [...prev.days, day]
                              }));
                            } else {
                              setScheduleFormData(prev => ({
                                ...prev,
                                days: prev.days.filter(d => d !== day)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={day} className="text-sm font-normal">
                          {day.substring(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
              <strong>Note:</strong> You can either enter a custom schedule text or build one using the time and days fields. 
              The built schedule will override the custom text.
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingSchedule}>
                {updatingSchedule ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Update Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}