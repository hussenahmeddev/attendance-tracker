import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Settings
} from "lucide-react";
import { useState } from "react";

const mockClasses = [
  { 
    id: "1", 
    name: "Mathematics Grade 10", 
    subject: "Mathematics", 
    grade: "10", 
    teacher: "Sarah Teacher", 
    teacherId: "TCH001",
    students: 28, 
    schedule: "Mon, Wed, Fri - 9:00 AM", 
    room: "Room 101",
    status: "active"
  },
  { 
    id: "2", 
    name: "Physics Grade 11", 
    subject: "Physics", 
    grade: "11", 
    teacher: "Mike Instructor", 
    teacherId: "TCH002",
    students: 24, 
    schedule: "Tue, Thu - 10:30 AM", 
    room: "Lab 201",
    status: "active"
  },
  { 
    id: "3", 
    name: "Chemistry Grade 12", 
    subject: "Chemistry", 
    grade: "12", 
    teacher: "Unassigned", 
    teacherId: null,
    students: 0, 
    schedule: "Not scheduled", 
    room: "Lab 202",
    status: "inactive"
  }
];

const mockTeachers = [
  { id: "TCH001", name: "Sarah Teacher" },
  { id: "TCH002", name: "Mike Instructor" },
  { id: "TCH003", name: "Lisa Professor" }
];

const mockStudents = [
  { id: "STD001", name: "Alice Student", grade: "10" },
  { id: "STD002", name: "Bob Student", grade: "11" },
  { id: "STD003", name: "Charlie Student", grade: "10" }
];

export default function AdminClasses() {
  const [classes, setClasses] = useState(mockClasses);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || cls.grade === gradeFilter;
    const matchesStatus = statusFilter === "all" || cls.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Class Management"
      pageDescription="Manage classes, subjects, and assignments"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="all-classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all-classes">All Classes</TabsTrigger>
            <TabsTrigger value="create-class">Create Class</TabsTrigger>
            <TabsTrigger value="assign-teachers">Assign Teachers</TabsTrigger>
            <TabsTrigger value="manage-students">Manage Students</TabsTrigger>
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
                  <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Class</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="className">Class Name</Label>
                          <Input id="className" placeholder="e.g., Mathematics Grade 10" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" placeholder="e.g., Mathematics" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grade">Grade</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({length: 12}, (_, i) => (
                                <SelectItem key={i+1} value={String(i+1)}>Grade {i+1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="room">Room</Label>
                          <Input id="room" placeholder="e.g., Room 101" />
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1">Create Class</Button>
                          <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
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
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i+1} value={String(i+1)}>Grade {i+1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Classes Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClasses.map((cls) => (
                    <Card key={cls.id} className={`border-l-4 ${cls.status === 'active' ? 'border-l-green-500' : 'border-l-gray-400'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{cls.name}</h3>
                            <p className="text-muted-foreground">{cls.subject} • Grade {cls.grade}</p>
                          </div>
                          <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                            {cls.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{cls.teacher}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{cls.students} students • {cls.room}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{cls.schedule}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Class Tab */}
          <TabsContent value="create-class" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newClassName">Class Name</Label>
                      <Input id="newClassName" placeholder="e.g., Advanced Mathematics" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newSubject">Subject</Label>
                      <Input id="newSubject" placeholder="e.g., Mathematics" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newGrade">Grade Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 12}, (_, i) => (
                            <SelectItem key={i+1} value={String(i+1)}>Grade {i+1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Maximum Capacity</Label>
                      <Input id="capacity" type="number" placeholder="e.g., 30" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newRoom">Classroom</Label>
                      <Input id="newRoom" placeholder="e.g., Room 101" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <textarea 
                        id="description" 
                        className="w-full p-2 border rounded-lg resize-none h-20"
                        placeholder="Class description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fall">Fall 2024</SelectItem>
                          <SelectItem value="spring">Spring 2025</SelectItem>
                          <SelectItem value="summer">Summer 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">Create Class</Button>
                  <Button variant="outline">Save as Draft</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assign Teachers Tab */}
          <TabsContent value="assign-teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assign Teachers to Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Current teacher: {cls.teacher}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockTeachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm">Assign</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Students Tab */}
          <TabsContent value="manage-students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Class Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Select>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enroll Students
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Available Students</h3>
                    <div className="space-y-2">
                      {mockStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <UserPlus className="h-4 w-4 mr-1" />
                              Enroll
                            </Button>
                            <Button size="sm" variant="outline">
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cls.schedule} • {cls.room}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Edit Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-1" />
                          Set Times
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Schedule Conflicts</h3>
                  <p className="text-sm text-muted-foreground">No scheduling conflicts detected.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}