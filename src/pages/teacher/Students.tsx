import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Eye, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchAllAttendance, type AttendanceRecord } from "@/lib/attendanceUtils";
import { DEFAULT_VALUES, ATTENDANCE_WEIGHTS } from "@/config/constants";

interface Student {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch students from Firebase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // 1. Fetch Students
        const usersCollection = collection(db, 'users');
        const studentsQuery = query(usersCollection, where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);

        const studentsData = studentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || 'N/A',
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
            role: data.role || 'student',
            status: data.status || 'active',
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
          } as Student;
        });

        setStudents(studentsData);

        // 2. Fetch Real Attendance Data
        const allAttendance = await fetchAllAttendance();

        // 3. Calculate Attendance Percentage per Student
        const stats: Record<string, number> = {};

        studentsData.forEach(student => {
          // Check both userId (STD001) and doc id for robustness
          const studentRecords = allAttendance.filter(r => r.studentId === student.userId || r.studentId === student.id);
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Calculate performance level based on REAL attendance
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 75) return "Good";
    if (percentage >= 50) return "Average";
    return "At Risk";
  };
  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Students"
      pageDescription="View and track your students' progress"
    >
      <div className="space-y-6">
        <UserProfile />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Performance Tracking
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
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">All Students:</label>
                  <p className="text-sm text-muted-foreground">
                    Showing {students.length} registered students
                  </p>
                </div>

                <div className="space-y-3">
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No students found</p>
                      <p className="text-sm text-muted-foreground">Students will appear here once they register</p>
                    </div>
                  ) : (
                    students.map((student) => {
                      const attendance = attendanceStats[student.id] || 0;
                      const performance = getPerformanceLevel(attendance);

                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.displayName}</p>
                              <p className="text-sm text-muted-foreground">{student.userId}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Attendance</p>
                              <p className="font-semibold">{attendance}%</p>
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
                            <Badge variant={student.status === "active" ? "default" : "secondary"}>
                              {student.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">Class Performance Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {students.length > 0
                          ? Math.round(Object.values(attendanceStats).reduce((a, b) => a + b, 0) / students.length)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{students.length}</p>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {students.filter(student => getPerformanceLevel(attendanceStats[student.id] || 0) === "At Risk").length}
                      </p>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}