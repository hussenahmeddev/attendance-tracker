import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, getDocs, updateDoc, doc, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Search, Users, BookOpen, UserPlus, UserMinus } from "lucide-react";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: string;
  enrolledClasses?: string[];
  teachingClasses?: string[];
}

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  teacherId: string;
  students: number;
  maxStudents: number;
}

interface ClassAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentComplete: () => void;
}

export function ClassAssignmentDialog({ open, onOpenChange, onAssignmentComplete }: ClassAssignmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User))
        .filter(user => !(user as any).deleted);

      // Fetch classes
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Class));

      setUsers(usersData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "students") {
      return user.role === "student" && matchesSearch;
    } else {
      return user.role === "teacher" && matchesSearch;
    }
  });

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleClassSelection = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId]);
    } else {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    }
  };

  const handleAssignStudentsToClasses = async () => {
    if (selectedUsers.length === 0 || selectedClasses.length === 0) {
      toast.error('Please select both students and classes');
      return;
    }

    try {
      setLoading(true);

      // Create enrollment records
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId);
        if (!user) continue;

        for (const classId of selectedClasses) {
          const classData = classes.find(c => c.id === classId);
          if (!classData) continue;

          // Check if enrollment already exists
          const existingEnrollment = await getDocs(query(
            collection(db, 'enrollments'),
            where('studentId', '==', user.userId),
            where('classId', '==', classId)
          ));

          if (existingEnrollment.docs.length === 0) {
            // Create new enrollment
            await addDoc(collection(db, 'enrollments'), {
              classId: classId,
              className: classData.name,
              studentId: user.userId,
              studentUserId: user.userId,
              studentName: user.displayName,
              teacherId: classData.teacherId,
              teacherName: classData.teacher,
              enrolledAt: new Date().toISOString(),
              status: 'active'
            });

            // Update class student count
            const classRef = doc(db, 'classes', classId);
            await updateDoc(classRef, {
              students: (classData.students || 0) + 1
            });
          }
        }

        // Update user's enrolled classes
        const userRef = doc(db, 'users', userId);
        const currentEnrolledClasses = user.enrolledClasses || [];
        const newEnrolledClasses = [...new Set([...currentEnrolledClasses, ...selectedClasses])];
        
        await updateDoc(userRef, {
          enrolledClasses: newEnrolledClasses
        });
      }

      toast.success(`Successfully assigned ${selectedUsers.length} students to ${selectedClasses.length} classes`);
      setSelectedUsers([]);
      setSelectedClasses([]);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning students:', error);
      toast.error('Failed to assign students to classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeachersToClasses = async () => {
    if (selectedUsers.length === 0 || selectedClasses.length === 0) {
      toast.error('Please select both teachers and classes');
      return;
    }

    try {
      setLoading(true);

      for (const classId of selectedClasses) {
        const classData = classes.find(c => c.id === classId);
        if (!classData) continue;

        // For simplicity, assign the first selected teacher to each class
        const teacherId = selectedUsers[0];
        const teacher = users.find(u => u.id === teacherId);
        if (!teacher) continue;

        // Update class with new teacher
        const classRef = doc(db, 'classes', classId);
        await updateDoc(classRef, {
          teacherId: teacher.userId,
          teacher: teacher.displayName,
          updatedAt: new Date().toISOString()
        });

        // Update teacher's teaching classes
        const teacherRef = doc(db, 'users', teacherId);
        const currentTeachingClasses = teacher.teachingClasses || [];
        const newTeachingClasses = [...new Set([...currentTeachingClasses, classId])];
        
        await updateDoc(teacherRef, {
          teachingClasses: newTeachingClasses
        });
      }

      toast.success(`Successfully assigned teacher to ${selectedClasses.length} classes`);
      setSelectedUsers([]);
      setSelectedClasses([]);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning teachers:', error);
      toast.error('Failed to assign teachers to classes');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignments = async () => {
    if (selectedUsers.length === 0 || selectedClasses.length === 0) {
      toast.error('Please select both users and classes to remove assignments');
      return;
    }

    try {
      setLoading(true);

      if (activeTab === "students") {
        // Remove student enrollments
        for (const userId of selectedUsers) {
          const user = users.find(u => u.id === userId);
          if (!user) continue;

          for (const classId of selectedClasses) {
            // Remove enrollment record
            const enrollments = await getDocs(query(
              collection(db, 'enrollments'),
              where('studentId', '==', user.userId),
              where('classId', '==', classId)
            ));

            for (const enrollment of enrollments.docs) {
              await updateDoc(doc(db, 'enrollments', enrollment.id), {
                status: 'inactive'
              });
            }

            // Update class student count
            const classData = classes.find(c => c.id === classId);
            if (classData) {
              const classRef = doc(db, 'classes', classId);
              await updateDoc(classRef, {
                students: Math.max(0, (classData.students || 0) - 1)
              });
            }
          }

          // Update user's enrolled classes
          const userRef = doc(db, 'users', userId);
          const currentEnrolledClasses = user.enrolledClasses || [];
          const newEnrolledClasses = currentEnrolledClasses.filter(id => !selectedClasses.includes(id));
          
          await updateDoc(userRef, {
            enrolledClasses: newEnrolledClasses
          });
        }
      } else {
        // Remove teacher assignments
        for (const classId of selectedClasses) {
          const classRef = doc(db, 'classes', classId);
          await updateDoc(classRef, {
            teacherId: '',
            teacher: 'Unassigned',
            updatedAt: new Date().toISOString()
          });
        }

        for (const userId of selectedUsers) {
          const user = users.find(u => u.id === userId);
          if (!user) continue;

          const userRef = doc(db, 'users', userId);
          const currentTeachingClasses = user.teachingClasses || [];
          const newTeachingClasses = currentTeachingClasses.filter(id => !selectedClasses.includes(id));
          
          await updateDoc(userRef, {
            teachingClasses: newTeachingClasses
          });
        }
      }

      toast.success('Successfully removed assignments');
      setSelectedUsers([]);
      setSelectedClasses([]);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing assignments:', error);
      toast.error('Failed to remove assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Class Assignments</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Assign Students</TabsTrigger>
            <TabsTrigger value="teachers">Assign Teachers</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users and classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 h-96">
              {/* Users Column */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {activeTab === "students" ? "Students" : "Teachers"} ({filteredUsers.length})
                </h3>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {user.role === 'student' && (
                            <div className="text-xs text-muted-foreground">
                              Enrolled in {user.enrolledClasses?.length || 0} classes
                            </div>
                          )}
                          {user.role === 'teacher' && (
                            <div className="text-xs text-muted-foreground">
                              Teaching {user.teachingClasses?.length || 0} classes
                            </div>
                          )}
                        </div>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Classes Column */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Classes ({filteredClasses.length})
                </h3>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {filteredClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={(checked) => handleClassSelection(cls.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{cls.name}</div>
                          <div className="text-xs text-muted-foreground">{cls.subject}</div>
                          <div className="text-xs text-muted-foreground">
                            Teacher: {cls.teacher} | Students: {cls.students}/{cls.maxStudents}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Selection Summary */}
            {(selectedUsers.length > 0 || selectedClasses.length > 0) && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Selected:</strong> {selectedUsers.length} {activeTab === "students" ? "students" : "teachers"}, {selectedClasses.length} classes
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveAssignments}
                disabled={loading || selectedUsers.length === 0 || selectedClasses.length === 0}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Assignments
              </Button>
              <Button
                onClick={activeTab === "students" ? handleAssignStudentsToClasses : handleAssignTeachersToClasses}
                disabled={loading || selectedUsers.length === 0 || selectedClasses.length === 0}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Assigning...' : 'Assign Selected'}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}