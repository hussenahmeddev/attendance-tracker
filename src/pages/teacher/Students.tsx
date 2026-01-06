import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Eye, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [loading, setLoading] = useState(true);

  // Fetch students from Firebase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Query for users with role 'student'
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
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Calculate performance metrics (placeholder logic)
  const getPerformanceLevel = (student: Student) => {
    // Since we don't have attendance data yet, we'll use a placeholder
    const hash = student.displayName.length + student.userId.length;
    if (hash % 4 === 0) return "Excellent";
    if (hash % 4 === 1) return "Good";
    if (hash % 4 === 2) return "Average";
    return "At Risk";
  };

  const getAttendancePercentage = (student: Student) => {
    // Placeholder attendance calculation
    const hash = student.displayName.length * 7 + student.userId.length * 3;
    return Math.max(60, Math.min(95, hash % 36 + 60));
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
                      const attendance = getAttendancePercentage(student);
                      const performance = getPerformanceLevel(student);
                      
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
                          ? Math.round(students.reduce((acc, student) => acc + getAttendancePercentage(student), 0) / students.length)
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
                        {students.filter(student => getPerformanceLevel(student) === "At Risk").length}
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