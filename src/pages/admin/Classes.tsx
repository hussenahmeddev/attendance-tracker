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
  XCircle
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
  type StudentInfo
} from "@/lib/classUtils";
import { toast } from "sonner";

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

  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    subject: '',
    teacher: '',
    grade: '',
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
      setFormData({ name: '', subject: '', teacher: '', grade: '', room: '', maxStudents: '' });
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
                                  <p className="text-muted-foreground">{cls.subject} • Grade {cls.grade}</p>
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
                                      View Details
                                    </Button>
                                    <Button size="sm" variant="outline">
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
                    <Button type="button" variant="outline" onClick={() => setFormData({ name: '', subject: '', teacher: '', grade: '', room: '', maxStudents: '' })}>
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
                                {cls.name} - {cls.subject} ({cls.students}/{cls.maxStudents})
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
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          View Calendar
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
          </TabsContent>
        </Tabs>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Class Details: {selectedClassDetails?.name}</DialogTitle>
            <DialogDescription>
              {selectedClassDetails?.subject} • {selectedClassDetails?.schedule} • {selectedClassDetails?.room}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-semibold mb-3">Enrolled Students ({enrolledStudents.length})</h3>
            {loadingDetails ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : enrolledStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No students enrolled yet.</p>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {enrolledStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                        {student.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{student.displayName}</div>
                        <div className="text-xs text-muted-foreground">{student.userId}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleUnenroll(student.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unenroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}