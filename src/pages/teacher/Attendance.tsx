import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Users, CheckCircle2, XCircle, AlertCircle, Calendar, Save, UserCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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
  type AttendanceRecord,
  checkAttendanceSessionLocked,
  broadcastAttendanceUpdate
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
  autoSaved?: boolean; // Track if this student's attendance was auto-saved
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
  const [autoSaving, setAutoSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Auto-save timeout reference
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

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

        // Check if session is locked (attendance already submitted)
        const isLocked = await checkAttendanceSessionLocked(selectedClass.id, selectedDate);
        setIsSessionLocked(isLocked);
        setSessionCompleted(records.length > 0 && isLocked);

        // Update student statuses based on existing records
        setStudents(prev => prev.map(student => {
          const existingRecord = records.find(r => r.studentId === student.userId);
          return {
            ...student,
            status: existingRecord?.status || 'present',
            attendanceId: existingRecord?.id,
            autoSaved: !!existingRecord
          };
        }));
      } catch (error) {
        console.error('Error fetching existing attendance:', error);
      }
    };

    fetchExistingAttendance();
  }, [selectedClass, selectedDate]);

  // Auto-save function with debouncing
  const autoSaveAttendance = useCallback(async (studentId: string, status: AttendanceStatus) => {
    if (!selectedClass || !userData || isSessionLocked) return;

    const student = students.find(s => s.userId === studentId);
    if (!student) return;

    setAutoSaving(true);
    try {
      const attendanceRecord = {
        classId: selectedClass.id,
        className: selectedClass.name,
        teacherId: userData.userId,
        teacherName: userData.displayName,
        studentId: student.userId,
        studentName: student.displayName,
        date: selectedDate,
        status: status,
        markedAt: new Date().toISOString(),
        notes: '',
        autoSaved: true
      };

      const recordId = await saveAttendanceRecord(attendanceRecord);
      
      // Update student state to reflect auto-save
      setStudents(prev => prev.map(s => 
        s.userId === studentId 
          ? { ...s, attendanceId: recordId, autoSaved: true }
          : s
      ));

      // Broadcast the auto-save update
      await broadcastAttendanceUpdate(
        selectedClass.id,
        selectedClass.name,
        selectedDate,
        userData.displayName,
        'auto-save'
      );

      console.log(`✓ Auto-saved ${student.displayName} - ${status}`);
    } catch (error) {
      console.error(`Failed to auto-save ${student.displayName}:`, error);
    } finally {
      setAutoSaving(false);
    }
  }, [selectedClass, userData, selectedDate, students, isSessionLocked]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    if (isSessionLocked) {
      alert('Attendance has already been submitted and cannot be changed.');
      return;
    }

    // Update UI immediately
    setStudents(prev =>
      prev.map(s => s.userId === studentId ? { ...s, status } : s)
    );

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save (debounced by 2 seconds)
    const timeout = setTimeout(() => {
      autoSaveAttendance(studentId, status);
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  const markAllPresent = () => {
    if (isSessionLocked) {
      alert('Attendance has already been submitted and cannot be changed.');
      return;
    }

    setStudents(prev => prev.map(s => ({ ...s, status: 'present' as AttendanceStatus })));
    
    // Auto-save all students as present after a short delay
    setTimeout(() => {
      students.forEach(student => {
        autoSaveAttendance(student.userId, 'present');
      });
    }, 1000);
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

    if (isSessionLocked) {
      alert('Attendance has already been submitted and cannot be changed.');
      return;
    }

    setSaving(true);
    try {
      console.log('Final submission - saving all attendance records...');

      // Save any remaining unsaved records
      for (const student of students) {
        if (!student.autoSaved) {
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

          await saveAttendanceRecord(attendanceRecord);
        }
      }

      // Create and complete attendance session to lock it
      const newSessionId = await createAttendanceSession(
        selectedClass.id,
        selectedClass.name,
        userData.userId,
        userData.displayName
      );

      const attendanceRecords = students.map(s => ({
        studentId: s.userId,
        status: s.status
      }));

      await completeAttendanceSession(newSessionId, attendanceRecords);

      // Broadcast completion
      await broadcastAttendanceUpdate(
        selectedClass.id,
        selectedClass.name,
        selectedDate,
        userData.displayName,
        'completion'
      );

      // Mark session as completed and locked
      setSessionCompleted(true);
      setIsSessionLocked(true);
      setSessionId(newSessionId);

      console.log('=== ATTENDANCE SUBMISSION COMPLETE ===');
      alert(`Attendance submitted successfully for ${selectedClass.name}! 
      
✓ ${students.length} students processed
✓ Session locked - no further changes allowed
✓ Instantly visible to admin & students`);

    } catch (error) {
      console.error('=== ATTENDANCE SUBMISSION ERROR ===');
      console.error('Full error:', error);
      alert(`Failed to submit attendance: ${error.message}. Check browser console for details.`);
    } finally {
      setSaving(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Take Attendance"
      pageDescription="Mark student attendance with auto-save and instant visibility to admin & students"
    >
      <div className="space-y-6">
        <UserProfile />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Take Attendance
              {autoSaving && (
                <Badge variant="secondary" className="ml-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                  Auto-saving...
                </Badge>
              )}
              {isSessionLocked && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
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
                      onChange={(e) => {
                        if (isSessionLocked) {
                          alert('Cannot change date - attendance already submitted for current selection.');
                          return;
                        }
                        setSelectedDate(e.target.value);
                      }}
                      max={getLocalYMD()}
                      disabled={isSessionLocked}
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
                    <div className={`p-4 rounded-lg mb-6 ${isSessionLocked ? 'bg-green-50 border border-green-200' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{selectedClass.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedDate} • {selectedClass.subject} • {students.length} students
                          </p>
                          {existingAttendance.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Attendance records found for this date
                            </p>
                          )}
                          {isSessionLocked && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              🔒 Attendance submitted and locked - visible to admin & students
                            </p>
                          )}
                          {autoSaving && (
                            <p className="text-xs text-orange-600 mt-1">
                              💾 Auto-saving changes...
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={markAllPresent} 
                            disabled={saving || isSessionLocked}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark All Present
                          </Button>
                          {!isSessionLocked ? (
                            <Button onClick={saveAttendance} disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Submitting...' : 'Submit Attendance'}
                            </Button>
                          ) : (
                            <Button variant="secondary" disabled>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Submitted
                            </Button>
                          )}
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
                          <div key={student.id} className={`flex items-center justify-between p-4 border rounded-lg ${isSessionLocked ? 'bg-gray-50' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{student.displayName}</p>
                                <p className="text-sm text-muted-foreground">{student.userId}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                                {student.autoSaved && (
                                  <p className="text-xs text-green-600">✓ Auto-saved</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={student.status === "present" ? "default" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "present")}
                                className="gap-1"
                                disabled={saving || isSessionLocked}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={student.status === "absent" ? "destructive" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "absent")}
                                className="gap-1"
                                disabled={saving || isSessionLocked}
                              >
                                <XCircle className="h-4 w-4" />
                                Absent
                              </Button>
                              <Button
                                size="sm"
                                variant={student.status === "late" ? "secondary" : "outline"}
                                onClick={() => handleAttendanceChange(student.userId, "late")}
                                className="gap-1"
                                disabled={saving || isSessionLocked}
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
                    {students.length > 0 && !isSessionLocked && (
                      <div className="flex gap-2 mt-6 pt-6 border-t">
                        <Button onClick={saveAttendance} className="flex-1" disabled={saving}>
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          {saving ? 'Submitting Attendance...' : `Submit Final Attendance (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late)`}
                        </Button>
                        <Button variant="outline" onClick={markAllPresent} disabled={saving}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Mark All Present
                        </Button>
                      </div>
                    )}

                    {/* Locked Session Message */}
                    {students.length > 0 && isSessionLocked && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-green-800">Attendance Submitted Successfully</h3>
                          <p className="text-sm text-green-700 mt-1">
                            Final count: {presentCount} Present, {absentCount} Absent, {lateCount} Late
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            ✓ Locked and instantly visible to admin & students
                          </p>
                        </div>
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