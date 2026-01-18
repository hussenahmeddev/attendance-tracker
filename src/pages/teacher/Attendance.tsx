import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Users, CheckCircle2, XCircle, AlertCircle, Calendar, Save, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTeacherClasses, type Class, getStudentsForClass, type StudentInfo } from "@/lib/classUtils";
import { setupInitialEnrollments, checkEnrollmentsExist } from "@/lib/enrollmentUtils";
import {
  createAttendanceSession,
  markAttendance,
  completeAttendanceSession,
  fetchAttendanceByDateAndClass,
  saveAttendanceRecord,
  getLocalYMD,
  type AttendanceStatus,
  type AttendanceRecord
} from "@/lib/attendanceUtils";

interface Student {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status: AttendanceStatus;
  createdAt: string;
  attendanceId?: string; // For tracking existing attendance records
}

import { useSearchParams } from "react-router-dom";

export default function TeacherAttendance() {
  const { userData } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());

  // Fetch students and teacher's classes
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.userId) return;

      try {
        // Fetch teacher's classes
        const teacherClasses = await fetchTeacherClasses(userData.userId);
        const activeClasses = teacherClasses.filter(c => c.status === 'active');
        setClasses(activeClasses);

        // Set initial class based on query param or default to first
        const classIdParam = searchParams.get('classId');
        if (classIdParam) {
          const paramClass = activeClasses.find(c => c.id === classIdParam);
          if (paramClass) {
            setSelectedClass(paramClass);
          } else if (activeClasses.length > 0) {
            setSelectedClass(activeClasses[0]);
          }
        } else if (activeClasses.length > 0) {
          setSelectedClass(activeClasses[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData, searchParams]);

  // Fetch students when class changes
  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching students for class:', selectedClass.id);

        // Check if enrollments exist, if not set them up
        const enrollmentsExist = await checkEnrollmentsExist();
        if (!enrollmentsExist) {
          console.log('No enrollments found, setting up initial enrollments...');
          await setupInitialEnrollments();
        }

        // Get students enrolled in the selected class
        const classStudents = await getStudentsForClass(selectedClass.id);
        console.log('Found enrolled students:', classStudents.length);

        if (classStudents.length === 0) {
          console.log('No students enrolled in this class. Please enroll students first.');
        }

        const studentsData = classStudents.map(student => ({
          ...student,
          status: 'present' as AttendanceStatus,
          createdAt: new Date().toLocaleDateString(),
          attendanceId: undefined
        }));

        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching class students:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassStudents();
  }, [selectedClass]);

  // Fetch existing attendance when class or date changes
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!selectedClass) return;

      try {
        const records = await fetchAttendanceByDateAndClass(selectedDate, selectedClass.id);
        setExistingAttendance(records);

        // Update student statuses based on existing records
        setStudents(prev => prev.map(student => {
          const existingRecord = records.find(r => r.studentId === student.userId);
          return {
            ...student,
            status: existingRecord?.status || 'present',
            attendanceId: existingRecord?.id
          };
        }));
      } catch (error) {
        console.error('Error fetching existing attendance:', error);
      }
    };

    fetchExistingAttendance();
  }, [selectedClass, selectedDate]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(s => s.userId === studentId ? { ...s, status } : s)
    );
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' as AttendanceStatus })));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !userData) {
      alert('Please select a class and ensure you are logged in');
      return;
    }

    if (students.length === 0) {
      alert('No students found to save attendance for');
      return;
    }

    setSaving(true);
    try {

      console.log('Selected date:', selectedDate);



      // Simple attendance save without sessions for now
      console.log('Saving attendance records directly...');
      const savedCount = 0;

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        console.log(`Saving ${i + 1}/${students.length}: ${student.displayName} - ${student.status}`);

        const attendanceRecord = {
          classId: selectedClass.id,
          className: selectedClass.name,
          teacherId: userData.userId,
          teacherName: userData.displayName,
          studentId: student.userId,
          studentName: student.displayName,
          date: selectedDate,
          status: student.status,
          markedAt: new Date().toISOString(),
          notes: ''
        };

        try {
          const recordId = await saveAttendanceRecord(attendanceRecord);
          console.log(`✓ Saved ${student.displayName} with ID: ${recordId}`);
        } catch (studentError) {
          console.error(`✗ Failed to save ${student.displayName}:`, studentError);
          throw new Error(`Failed to save attendance for ${student.displayName}: ${studentError.message}`);
        }
      }

      console.log('=== ATTENDANCE SAVE COMPLETE ===');
      alert(`Attendance saved successfully for ${selectedClass.name}! Saved ${students.length} records.`);

      // Refresh the page data
      window.location.reload();

    } catch (error) {
      console.error('=== ATTENDANCE SAVE ERROR ===');
      console.error('Full error:', error);
      alert(`Failed to save attendance: ${error.message}. Check browser console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Take Attendance"
      pageDescription="Mark student attendance for today's class"
    >
      <div className="space-y-6">
        <UserProfile />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Take Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading classes and students...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Class and Date Selection */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="class-select">Select Class *</Label>
                    <Select
                      value={selectedClass?.id || ''}
                      onValueChange={(value) => {
                        const foundClass = classes.find(c => c.id === value);
                        setSelectedClass(foundClass || null);
                        setSessionId(null); // Reset session when class changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length > 0 ? (
                          classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {cls.subject}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No active classes found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-select">Date</Label>
                    <Input
                      id="date-select"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={getLocalYMD()}
                    />
                  </div>
                </div>

                {!selectedClass ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Please select a class to take attendance</p>
                    <p className="text-sm text-muted-foreground">
                      {classes.length === 0 ? 'No active classes found. Contact admin to get classes assigned.' : 'Choose from your assigned classes above.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">{students.length}</div>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                          <p className="text-sm text-muted-foreground">Present</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                          <p className="text-sm text-muted-foreground">Absent</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                          <p className="text-sm text-muted-foreground">Late</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Class Info */}
                    <div className="bg-muted/30 p-4 rounded-lg mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{selectedClass.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedDate} • {selectedClass.subject} • {students.length} students
                          </p>
                          {existingAttendance.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Attendance already recorded for this date
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={markAllPresent} disabled={saving}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark All Present
                          </Button>
                          <Button onClick={saveAttendance} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Attendance'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="space-y-3">
                      {students.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No students enrolled in this class</p>
                          <p className="text-sm text-muted-foreground">Students need to be enrolled in this class to take attendance</p>
                          <p className="text-xs text-muted-foreground mt-2">Contact your administrator to enroll students</p>
                        </div>
                      ) : (
                        students.map((student) => (
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
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={student.status === "present" ? "default" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "present")}
                                className="gap-1"
                                disabled={saving}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={student.status === "absent" ? "destructive" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "absent")}
                                className="gap-1"
                                disabled={saving}
                              >
                                <XCircle className="h-4 w-4" />
                                Absent
                              </Button>
                              <Button
                                size="sm"
                                variant={student.status === "late" ? "secondary" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "late")}
                                className="gap-1"
                                disabled={saving}
                              >
                                <AlertCircle className="h-4 w-4" />
                                Late
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Action Buttons */}
                    {students.length > 0 && (
                      <div className="flex gap-2 mt-6 pt-6 border-t">
                        <Button onClick={saveAttendance} className="flex-1" disabled={saving}>
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          {saving ? 'Saving Attendance...' : `Save Attendance (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late)`}
                        </Button>
                        <Button variant="outline" onClick={markAllPresent} disabled={saving}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Mark All Present
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}