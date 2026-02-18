import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Users, Eye, TrendingUp, BookOpen, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTeacherClasses, getStudentsForClass, type Class, type StudentInfo } from "@/lib/classUtils";
import { fetchAllAttendance, type AttendanceRecord } from "@/lib/attendanceUtils";
import { ATTENDANCE_WEIGHTS } from "@/config/constants";
import { toast } from "sonner";

export default function TeacherStudents() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  // Fetch teacher's classes and their students
  useEffect(() => {
    const fetchTeacherStudents = async () => {
      if (!userData?.userId) return;

      try {
        setLoading(true);

        // 1. Fetch teacher's assigned classes
        const teacherClasses = await fetchTeacherClasses(userData.userId);
        setClasses(teacherClasses);

        // 2. Fetch students from all assigned classes
        const allStudents: StudentInfo[] = [];
        const studentIds = new Set<string>(); // To avoid duplicates

        for (const cls of teacherClasses) {
          const classStudents = await getStudentsForClass(cls.id);
          classStudents.forEach(student => {
            if (!studentIds.has(student.id)) {
              studentIds.add(student.id);
              allStudents.push({
                ...student,
                className: cls.name, // Add class name for reference
                classSubject: cls.subject
              } as StudentInfo & { className: string; classSubject: string });
            }
          });
        }

        setStudents(allStudents);

        // 3. Fetch attendance data and calculate percentages
        const allAttendance = await fetchAllAttendance();
        const stats: Record<string, number> = {};

        allStudents.forEach(student => {
          // Get attendance records for this student
          const studentRecords = allAttendance.filter(r => 
            r.studentId === student.userId || r.studentId === student.id
          );
          
          const totalClasses = studentRecords.length;

          if (totalClasses === 0) {
            stats[student.id] = 0;
          } else {
            const present = studentRecords.filter(r => r.status === 'present').length;
            const late = studentRecords.filter(r => r.status === 'late').length;
            const excused = studentRecords.filter(r => r.status === 'excused').length;

            stats[student.id] = Math.round((
              (present * ATTENDANCE_WEIGHTS.PRESENT) +
              (late * ATTENDANCE_WEIGHTS.LATE) +
              (excused * ATTENDANCE_WEIGHTS.EXCUSED)
            ) / totalClasses * 100);
          }
        });

        setAttendanceStats(stats);

      } catch (error) {
        console.error('Error fetching teacher students:', error);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherStudents();
  }, [userData]);

  // Calculate performance level based on attendance
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 75) return "Good";
    if (percentage >= 50) return "Average";
    return "At Risk";
  };

  const handleViewDetails = (student: StudentInfo) => {
    setSelectedStudent(student);
    setIsViewDetailsOpen(true);
  };
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="My Students"
      pageDescription="View students from your assigned classes"
    >
      <div className="space-y-6">
        <UserProfile />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Students in My Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading students...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                      <p className="text-sm text-muted-foreground">My Classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{students.length}</div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {students.length > 0
                          ? Math.round(Object.values(attendanceStats).reduce((a, b) => a + b, 0) / students.length)
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {students.filter(student => getPerformanceLevel(attendanceStats[student.id] || 0) === "At Risk").length}
                      </div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No students found</p>
                      <p className="text-sm text-muted-foreground">
                        {classes.length === 0 
                          ? "You don't have any assigned classes yet"
                          : "No students are enrolled in your classes yet"
                        }
                      </p>
                    </div>
                  ) : (
                    students.map((student) => {
                      const attendance = attendanceStats[student.id] || 0;
                      const performance = getPerformanceLevel(attendance);

                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.displayName}</p>
                              <p className="text-sm text-muted-foreground">{student.userId}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <BookOpen className="h-3 w-3" />
                                <span>{(student as any).className || 'Multiple Classes'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Attendance</p>
                              <p className="font-semibold text-lg">{attendance}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Performance</p>
                              <Badge
                                variant="outline"
                                className={
                                  performance === "Excellent" ? "bg-green-50 text-green-700 border-green-200" :
                                    performance === "Good" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      performance === "Average" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                        "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {performance}
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDetails(student)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Class Breakdown */}
                {classes.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Students by Class</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {classes.map((cls) => {
                        const classStudents = students.filter(s => 
                          // This is a simplified check - in a real app you'd track class enrollment properly
                          true // For now, show all students under each class
                        );
                        
                        return (
                          <Card key={cls.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{cls.name}</h4>
                                  <p className="text-sm text-muted-foreground">{cls.subject}</p>
                                </div>
                                <Badge variant="secondary">{cls.students} students</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {cls.schedule}
                                </div>
                                <div className="flex items-center gap-1">
                                  <BookOpen className="h-4 w-4" />
                                  {cls.room}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>
              Read-only student information
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedStudent.displayName}</h3>
                  <p className="text-muted-foreground">{selectedStudent.userId}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded">
                  <span className="font-medium">Student ID</span>
                  <span>{selectedStudent.userId}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded">
                  <span className="font-medium">Full Name</span>
                  <span>{selectedStudent.displayName}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded">
                  <span className="font-medium">Attendance Percentage</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {attendanceStats[selectedStudent.id] || 0}%
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        getPerformanceLevel(attendanceStats[selectedStudent.id] || 0) === "Excellent" ? "bg-green-50 text-green-700 border-green-200" :
                        getPerformanceLevel(attendanceStats[selectedStudent.id] || 0) === "Good" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        getPerformanceLevel(attendanceStats[selectedStudent.id] || 0) === "Average" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {getPerformanceLevel(attendanceStats[selectedStudent.id] || 0)}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is a read-only view. Contact administration for any student information updates.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}