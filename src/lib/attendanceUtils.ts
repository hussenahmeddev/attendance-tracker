import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  notes?: string;
  markedAt: string; // ISO timestamp
  updatedAt?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD format
  sessionTime: string; // HH:MM format
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  lastAttendance?: string;
}

/**
 * Create a new attendance session for a class
 */
export const createAttendanceSession = async (
  classId: string,
  className: string,
  teacherId: string,
  teacherName: string,
  sessionTime: string = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
): Promise<string> => {
  try {
    console.log('createAttendanceSession called with:', {
      classId,
      className,
      teacherId,
      teacherName,
      sessionTime
    });

    const today = new Date().toISOString().split('T')[0];
    
    const sessionData = {
      classId,
      className,
      teacherId,
      teacherName,
      date: today,
      sessionTime,
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    };

    console.log('Attempting to save session data:', sessionData);
    
    const docRef = await addDoc(collection(db, 'attendanceSessions'), sessionData);
    console.log('Successfully created session with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error in createAttendanceSession:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Mark attendance for a student
 */
export const markAttendance = async (
  sessionId: string,
  classId: string,
  className: string,
  teacherId: string,
  teacherName: string,
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
  notes?: string
): Promise<string> => {
  try {
    console.log('markAttendance called with:', {
      sessionId,
      classId,
      className,
      teacherId,
      teacherName,
      studentId,
      studentName,
      status,
      notes
    });

    const today = new Date().toISOString().split('T')[0];
    
    const attendanceData = {
      sessionId,
      classId,
      className,
      teacherId,
      teacherName,
      studentId,
      studentName,
      date: today,
      status,
      notes: notes || '',
      markedAt: new Date().toISOString()
    };

    console.log('Attempting to save attendance data:', attendanceData);
    
    const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
    console.log('Successfully saved attendance with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Update attendance record
 */
export const updateAttendance = async (
  attendanceId: string,
  status: AttendanceStatus,
  notes?: string
): Promise<void> => {
  try {
    const attendanceRef = doc(db, 'attendance', attendanceId);
    await updateDoc(attendanceRef, {
      status,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

/**
 * Complete an attendance session
 */
export const completeAttendanceSession = async (
  sessionId: string,
  attendanceRecords: { studentId: string; status: AttendanceStatus }[]
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'attendanceSessions', sessionId);
    
    const totalStudents = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;

    await updateDoc(sessionRef, {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing attendance session:', error);
    throw error;
  }
};

/**
 * Fetch attendance records for a specific date and class
 */
export const fetchAttendanceByDateAndClass = async (
  date: string,
  classId?: string
): Promise<AttendanceRecord[]> => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('date', '==', date),
      orderBy('markedAt', 'desc')
    );

    if (classId) {
      q = query(
        collection(db, 'attendance'),
        where('date', '==', date),
        where('classId', '==', classId),
        orderBy('markedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

/**
 * Fetch attendance records for a specific student
 */
export const fetchStudentAttendance = async (
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range if provided
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
};

/**
 * Fetch attendance records for a teacher's classes
 */
export const fetchTeacherAttendance = async (
  teacherId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  try {
    let q = query(
      collection(db, 'attendance'),
      where('teacherId', '==', teacherId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range if provided
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching teacher attendance:', error);
    throw error;
  }
};

/**
 * Fetch all attendance records (admin view)
 */
export const fetchAllAttendance = async (
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'attendance'),
      orderBy('date', 'desc'),
      orderBy('markedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range if provided
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    return records;
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    throw error;
  }
};

/**
 * Calculate attendance summary for a student
 */
export const calculateStudentAttendanceSummary = async (
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudentAttendanceSummary> => {
  try {
    const records = await fetchStudentAttendance(studentId, startDate, endDate);
    
    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;
    
    const attendancePercentage = totalClasses > 0 
      ? Math.round(((presentCount + lateCount) / totalClasses) * 100) 
      : 0;

    const lastAttendance = records.length > 0 ? records[0].date : undefined;

    return {
      studentId,
      studentName: records.length > 0 ? records[0].studentName : 'Unknown',
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
      lastAttendance
    };
  } catch (error) {
    console.error('Error calculating student attendance summary:', error);
    throw error;
  }
};

/**
 * Get attendance statistics for a date range
 */
export const getAttendanceStatistics = async (
  startDate?: string,
  endDate?: string,
  classId?: string,
  teacherId?: string
): Promise<{
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  uniqueStudents: number;
  uniqueClasses: number;
}> => {
  try {
    let records: AttendanceRecord[] = [];

    if (teacherId) {
      records = await fetchTeacherAttendance(teacherId, startDate, endDate);
    } else {
      records = await fetchAllAttendance(startDate, endDate);
    }

    if (classId) {
      records = records.filter(r => r.classId === classId);
    }

    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;
    
    const attendanceRate = totalRecords > 0 
      ? Math.round(((presentCount + lateCount) / totalRecords) * 100) 
      : 0;

    const uniqueStudents = new Set(records.map(r => r.studentId)).size;
    const uniqueClasses = new Set(records.map(r => r.classId)).size;

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
      uniqueStudents,
      uniqueClasses
    };
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    throw error;
  }
};

/**
 * Delete attendance record
 */
export const deleteAttendanceRecord = async (attendanceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'attendance', attendanceId));
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};

/**
 * Get attendance data for calendar view
 */
export const getAttendanceCalendarData = async (
  studentId: string,
  year: number,
  month: number
): Promise<Record<string, AttendanceStatus>> => {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
    
    const records = await fetchStudentAttendance(studentId, startDate, endDate);
    
    const calendarData: Record<string, AttendanceStatus> = {};
    records.forEach(record => {
      calendarData[record.date] = record.status;
    });
    
    return calendarData;
  } catch (error) {
    console.error('Error getting calendar attendance data:', error);
    throw error;
  }
};

/**
 * Get attendance trends for chart visualization
 */
export const getAttendanceTrends = async (
  days: number = 7,
  classId?: string,
  teacherId?: string
): Promise<Array<{
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}>> => {
  try {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const records = await fetchAttendanceByDateAndClass(dateString, classId);
      
      let filteredRecords = records;
      if (teacherId) {
        filteredRecords = records.filter(r => r.teacherId === teacherId);
      }
      
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: filteredRecords.filter(r => r.status === 'present').length,
        absent: filteredRecords.filter(r => r.status === 'absent').length,
        late: filteredRecords.filter(r => r.status === 'late').length,
        excused: filteredRecords.filter(r => r.status === 'excused').length,
      });
    }
    
    return trends;
  } catch (error) {
    console.error('Error getting attendance trends:', error);
    throw error;
  }
};