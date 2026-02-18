import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy, limit, DocumentData, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { saveOfflineAttendance } from "./offlineStorage";
import { ATTENDANCE_WEIGHTS } from '@/config/constants';

/**
 * Helper to get local date as YYYY-MM-DD string
 * Fixes timezone issues where toISOString() uses UTC
 */
export const getLocalYMD = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
 * Check if attendance session is locked for a specific class and date
 */
export const checkAttendanceSessionLocked = async (
  classId: string,
  date: string
): Promise<boolean> => {
  try {
    // Check if there's a completed attendance session for this class and date
    const q = query(
      collection(db, 'attendanceSessions'),
      where('classId', '==', classId),
      where('date', '==', date),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0;
  } catch (error) {
    console.error('Error checking attendance session lock:', error);
    // If we can't check, assume it's not locked to allow functionality
    return false;
  }
};

/**
 * Check if attendance already exists for a student on a specific date and class
 */
export const checkExistingAttendance = async (
  studentId: string,
  classId: string,
  date: string
): Promise<AttendanceRecord | null> => {
  try {
    // Determine query based on available indexes
    // To be safe, we'll query by studentId and classId, then filter by date in memory
    // This avoids needing complex composite indexes
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      where('classId', '==', classId)
    );

    const snapshot = await getDocs(q);

    // Filter by date in memory
    const existing = snapshot.docs.find(doc => doc.data().date === date);

    if (!existing) {
      return null;
    }

    return {
      id: existing.id,
      ...existing.data()
    } as AttendanceRecord;
  } catch (error) {
    console.error('Error checking existing attendance:', error);
    // Fallback: try querying just by studentId and date
    // This helps if the specific index above is missing but others exist
    try {
      const q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('date', '==', date)
      );

      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find(doc => doc.data().classId === classId);

      if (!existing) return null;

      return {
        id: existing.id,
        ...existing.data()
      } as AttendanceRecord;
    } catch (fallbackError) {
      console.error('Fallback check failed:', fallbackError);
      throw error;
    }
  }
};

/**
 * Save or update attendance record
 */
export const saveAttendanceRecord = async (attendanceData: Omit<AttendanceRecord, 'id'> & { autoSaved?: boolean }): Promise<string> => {
  // If offline, bypass existence check and save to local queue
  if (typeof window !== 'undefined' && !navigator.onLine) {
    try {
      const timestamp = new Date().toISOString();
      await saveOfflineAttendance({
        ...attendanceData,
        sessionId: (attendanceData as any).sessionId || 'unknown',
        timestamp
      });
      console.log(`Offline: Saved attendance for ${attendanceData.studentName} locally`);
      return `offline-${Date.now()}`;
    } catch (offlineError) {
      console.error('Failed to save offline attendance:', offlineError);
    }
  }

  try {
    // Check if attendance already exists (Online only)
    const existing = await checkExistingAttendance(
      attendanceData.studentId,
      attendanceData.classId,
      attendanceData.date
    );

    if (existing) {
      // Update existing record
      const attendanceRef = doc(db, 'attendance', existing.id);
      await updateDoc(attendanceRef, {
        ...attendanceData,
        updatedAt: new Date().toISOString()
      });
      console.log(`Updated existing attendance for ${attendanceData.studentName}`);
      return existing.id;
    } else {
      // Create new record
      const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
      console.log(`Created new attendance for ${attendanceData.studentName}`);
      return docRef.id;
    }
  } catch (error) {
    console.warn('Firestore operation failed, falling back to local storage:', error);
    try {
      const timestamp = new Date().toISOString();
      await saveOfflineAttendance({
        ...attendanceData,
        sessionId: (attendanceData as any).sessionId || 'unknown',
        timestamp
      });
      return `offline-${Date.now()}`;
    } catch (fallbackError) {
      console.error('Double failure in saveAttendanceRecord:', fallbackError);
      throw error;
    }
  }
};

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
    const today = getLocalYMD();

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

    const docRef = await addDoc(collection(db, 'attendanceSessions'), sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error in createAttendanceSession:', error);
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
  const today = getLocalYMD();
  const timestamp = new Date().toISOString();

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
    markedAt: timestamp
  };

  // If offline, store locally
  if (typeof window !== 'undefined' && !navigator.onLine) {
    try {
      await saveOfflineAttendance({
        ...attendanceData,
        timestamp
      });
      console.log(`Offline: Saved attendance for ${studentName} locally`);
      return `offline-${Date.now()}`;
    } catch (offlineError) {
      console.error('Failed to save offline attendance:', offlineError);
    }
  }

  // If online, try Firestore
  try {
    const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
    return docRef.id;
  } catch (error) {
    console.warn('Firestore write failed, falling back to local storage:', error);
    // Fallback if network is flickery or permission fails
    try {
      await saveOfflineAttendance({
        ...attendanceData,
        timestamp
      });
      return `offline-${Date.now()}`;
    } catch (fallbackError) {
      console.error('Double failure in markAttendance:', fallbackError);
      throw error;
    }
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
    // Query without orderBy first to avoid index issues
    let q = query(
      collection(db, 'attendance'),
      where('date', '==', date)
    );

    if (classId) {
      q = query(
        collection(db, 'attendance'),
        where('date', '==', date),
        where('classId', '==', classId)
      );
    }

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Sort in memory instead
    return records.sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime());
  } catch (error) {
    console.error('Error fetching attendance records:', error);

    // Fallback: fetch all for date then filter by class in memory
    // This helps if the composite index (date + classId) is missing
    if (classId) {
      try {
        const q = query(
          collection(db, 'attendance'),
          where('date', '==', date)
        );
        const snapshot = await getDocs(q);
        const records = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord))
          .filter(r => r.classId === classId);

        return records.sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime());
      } catch (fbError) {
        console.error('Fallback fetch failed:', fbError);
      }
    }

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
    // Avoid composite index requirement (where + orderBy)
    // Just fetch by studentId
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId)
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range in memory
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    // Sort by date descending in memory
    return records.sort((a, b) => b.date.localeCompare(a.date));
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
    // Avoid composite index requirement (where + orderBy)
    // Just fetch by teacherId
    const q = query(
      collection(db, 'attendance'),
      where('teacherId', '==', teacherId)
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range in memory
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    // Sort by date descending in memory
    return records.sort((a, b) => b.date.localeCompare(a.date));
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
  endDate?: string,
  limitCount: number = 500
): Promise<AttendanceRecord[]> => {
  try {
    // Fetch records with limit to prevent excessive data transfer
    const attendanceCollection = collection(db, 'attendance');
    const q = query(attendanceCollection, orderBy('markedAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    let records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));

    // Filter by date range in memory
    if (startDate || endDate) {
      records = records.filter(record => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        return true;
      });
    }

    // Sort by date descending in memory
    return records.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime();
    });
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
      ? Math.round((
        (presentCount * ATTENDANCE_WEIGHTS.PRESENT) +
        (lateCount * ATTENDANCE_WEIGHTS.LATE) +
        (excusedCount * ATTENDANCE_WEIGHTS.EXCUSED)
      ) / totalClasses * 100)
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
      ? Math.round((
        (presentCount * ATTENDANCE_WEIGHTS.PRESENT) +
        (lateCount * ATTENDANCE_WEIGHTS.LATE) +
        (excusedCount * ATTENDANCE_WEIGHTS.EXCUSED)
      ) / totalRecords * 100)
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
 * Get attendance trends for chart visualization (optimized)
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
    
    // Calculate date range
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Fetch all records in date range at once instead of individual queries
    let records: AttendanceRecord[] = [];
    if (teacherId) {
      records = await fetchTeacherAttendance(teacherId, startDateStr, endDateStr);
    } else {
      records = await fetchAllAttendance(startDateStr, endDateStr, 1000); // Limit for performance
    }

    if (classId) {
      records = records.filter(r => r.classId === classId);
    }

    // Group records by date
    const recordsByDate = new Map<string, AttendanceRecord[]>();
    records.forEach(record => {
      if (!recordsByDate.has(record.date)) {
        recordsByDate.set(record.date, []);
      }
      recordsByDate.get(record.date)!.push(record);
    });

    // Generate trends for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const dayRecords = recordsByDate.get(dateString) || [];

      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        late: dayRecords.filter(r => r.status === 'late').length,
        excused: dayRecords.filter(r => r.status === 'excused').length,
      });
    }

    return trends;
  } catch (error) {
    console.error('Error getting attendance trends:', error);
    throw error;
  }
};

/**
 * Broadcast attendance update for real-time visibility
 * This creates a simple notification system for instant visibility
 */
export const broadcastAttendanceUpdate = async (
  classId: string,
  className: string,
  date: string,
  teacherName: string,
  updateType: 'auto-save' | 'submission' | 'completion'
): Promise<void> => {
  try {
    const broadcastData = {
      type: 'attendance_update',
      classId,
      className,
      date,
      teacherName,
      updateType,
      timestamp: new Date().toISOString(),
      message: updateType === 'completion' 
        ? `Attendance submitted for ${className} on ${date}`
        : updateType === 'submission'
        ? `Attendance being submitted for ${className}`
        : `Attendance auto-saved for ${className}`
    };

    // Store in a broadcasts collection for real-time updates
    await addDoc(collection(db, 'attendanceBroadcasts'), broadcastData);
    
    console.log(`📡 Broadcasted: ${broadcastData.message}`);
  } catch (error) {
    console.error('Error broadcasting attendance update:', error);
    // Don't throw - broadcasting is optional
  }
};