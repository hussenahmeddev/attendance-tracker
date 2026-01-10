import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacher: string;
  teacherId: string;
  students: number;
  maxStudents: number;
  schedule: string;
  room: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  requestedAt?: string;
}

export interface ClassFormData {
  name: string;
  subject: string;
  teacher: string;
  grade: string;
  room: string;
  maxStudents: string;
}

/**
 * Fetch all classes from Firestore
 */
export const fetchAllClasses = async (): Promise<Class[]> => {
  try {
    const classesCollection = collection(db, 'classes');
    const classesSnapshot = await getDocs(classesCollection);
    return classesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Class',
        subject: data.subject || 'General',
        grade: data.grade || 'All',
        teacher: data.teacher || 'Unassigned',
        teacherId: data.teacherId || 'N/A',
        students: data.students || 0,
        maxStudents: data.maxStudents || 30,
        schedule: data.schedule || 'To be scheduled',
        room: data.room || 'TBD',
        status: data.status || 'active',
        createdAt: data.createdAt || new Date().toISOString(),
        requestedAt: data.requestedAt
      } as Class;
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

/**
 * Fetch classes assigned to a specific teacher
 */
export const fetchTeacherClasses = async (teacherId: string): Promise<Class[]> => {
  try {
    const classesCollection = collection(db, 'classes');
    const teacherClassesQuery = query(classesCollection, where('teacherId', '==', teacherId));
    const classesSnapshot = await getDocs(teacherClassesQuery);
    return classesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Class',
        subject: data.subject || 'General',
        grade: data.grade || 'All',
        teacher: data.teacher || 'Unassigned',
        teacherId: data.teacherId || 'N/A',
        students: data.students || 0,
        maxStudents: data.maxStudents || 30,
        schedule: data.schedule || 'To be scheduled',
        room: data.room || 'TBD',
        status: data.status || 'active',
        createdAt: data.createdAt || new Date().toISOString(),
        requestedAt: data.requestedAt
      } as Class;
    });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    throw error;
  }
};

/**
 * Create a new class
 */
export const createClass = async (classData: Omit<Class, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

/**
 * Update a class
 */
export const updateClass = async (classId: string, updates: Partial<Class>): Promise<void> => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, updates);
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (classId: string): Promise<void> => {
  try {
    const classRef = doc(db, 'classes', classId);
    await deleteDoc(classRef);
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

/**
 * Approve a pending class request
 */
export const approveClassRequest = async (classId: string): Promise<void> => {
  try {
    await updateClass(classId, { status: 'active' });
  } catch (error) {
    console.error('Error approving class request:', error);
    throw error;
  }
};

/**
 * Reject a pending class request
 */
export const rejectClassRequest = async (classId: string): Promise<void> => {
  try {
    await deleteClass(classId);
  } catch (error) {
    console.error('Error rejecting class request:', error);
    throw error;
  }
};

/**
 * Get class statistics
 */
export const getClassStats = (classes: Class[]) => {
  return {
    total: classes.length,
    active: classes.filter(c => c.status === 'active').length,
    pending: classes.filter(c => c.status === 'pending').length,
    totalStudents: classes.reduce((acc, c) => acc + c.students, 0),
    averageClassSize: classes.length > 0 ? Math.round(classes.reduce((acc, c) => acc + c.students, 0) / classes.length) : 0
  };
};

// Enrollment interfaces and functions
export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentUserId: string;
  studentName: string;
  enrolledAt: string;
  status: 'active' | 'inactive';
}

export interface StudentInfo {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
}

/**
 * Get students enrolled in a specific class
 */
export const getStudentsForClass = async (classId: string): Promise<StudentInfo[]> => {
  try {
    // Get enrollments for this class
    const enrollmentsCollection = collection(db, 'enrollments');
    const enrollmentsQuery = query(
      enrollmentsCollection,
      where('classId', '==', classId),
      where('status', '==', 'active')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    if (enrollmentsSnapshot.empty) {
      console.log(`No enrollments found for class ${classId}`);
      return [];
    }

    // Get student IDs from enrollments
    const studentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);

    // Fetch student details
    const usersCollection = collection(db, 'users');
    const students: StudentInfo[] = [];

    // Get all students first, then filter by enrolled IDs
    const allStudentsSnapshot = await getDocs(usersCollection);

    for (const studentDoc of allStudentsSnapshot.docs) {
      if (studentIds.includes(studentDoc.id)) {
        const studentData = studentDoc.data();
        students.push({
          id: studentDoc.id,
          userId: studentData.userId || 'N/A',
          displayName: studentData.displayName || 'Unknown',
          email: studentData.email || 'No email',
          role: studentData.role || 'student'
        });
      }
    }

    return students;
  } catch (error) {
    console.error('Error fetching students for class:', error);
    return [];
  }
};

/**
 * Enroll a student in a class
 */
export const enrollStudentInClass = async (classId: string, studentId: string, studentUserId: string, studentName: string): Promise<void> => {
  try {
    // Check if already enrolled
    const enrollmentsCollection = collection(db, 'enrollments');
    const existingQuery = query(
      enrollmentsCollection,
      where('classId', '==', classId),
      where('studentId', '==', studentId),
      where('status', '==', 'active')
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error('Student is already enrolled in this class');
    }

    // Create enrollment record
    const enrollment: Omit<Enrollment, 'id'> = {
      classId,
      studentId,
      studentUserId,
      studentName,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };

    await addDoc(enrollmentsCollection, enrollment);

    // Update class student count
    const classRef = doc(db, 'classes', classId);
    const classesCollection = collection(db, 'classes');
    const classQuery = query(classesCollection, where('__name__', '==', classId));
    const classSnapshot = await getDocs(classQuery);

    if (!classSnapshot.empty) {
      const currentStudents = classSnapshot.docs[0].data().students || 0;
      await updateDoc(classRef, { students: currentStudents + 1 });
    }
  } catch (error) {
    console.error('Error enrolling student:', error);
    throw error;
  }
};

/**
 * Get all students not enrolled in a specific class
 */
export const getAvailableStudentsForClass = async (classId: string): Promise<StudentInfo[]> => {
  try {
    // Get all students
    const usersCollection = collection(db, 'users');
    const studentsQuery = query(usersCollection, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);

    const allStudents = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId || 'N/A',
      displayName: doc.data().displayName || 'Unknown',
      email: doc.data().email || 'No email',
      role: doc.data().role || 'student'
    }));

    // Get enrolled students
    const enrolledStudents = await getStudentsForClass(classId);
    const enrolledIds = new Set(enrolledStudents.map(s => s.id));

    // Return students not enrolled
    return allStudents.filter(student => !enrolledIds.has(student.id));
  } catch (error) {
    console.error('Error fetching available students:', error);
    return [];
  }
};

/**
 * Unenroll a student from a class
 */
export const unenrollStudent = async (classId: string, studentId: string): Promise<void> => {
  try {
    // 1. Find the enrollment record
    const enrollmentsCollection = collection(db, 'enrollments');
    const q = query(
      enrollmentsCollection,
      where('classId', '==', classId),
      where('studentId', '==', studentId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Enrollment not found');
    }

    // 2. Delete or update status
    // Deleting for now to keep it simple
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // 3. Update class student count
    const classRef = doc(db, 'classes', classId);
    const classDoc = await getDocs(query(collection(db, 'classes'), where('__name__', '==', classId)));

    if (!classDoc.empty) {
      const currentStudents = classDoc.docs[0].data().students || 0;
      await updateDoc(classRef, { students: Math.max(0, currentStudents - 1) });
    }

  } catch (error) {
    console.error('Error unenrolling student:', error);
    throw error;
  }
};

/**
 * Get all classes a student is enrolled in
 */
export const getEnrolledClassesForStudent = async (studentUserId: string): Promise<Class[]> => {
  try {
    // 1. Get enrollments for this student
    const enrollmentsCollection = collection(db, 'enrollments');
    const enrollmentsQuery = query(
      enrollmentsCollection,
      where('studentUserId', '==', studentUserId),
      where('status', '==', 'active')
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    if (enrollmentsSnapshot.empty) {
      return [];
    }

    const classIds = enrollmentsSnapshot.docs.map(doc => doc.data().classId);

    // 2. Fetch class details
    const classesCollection = collection(db, 'classes');
    const classesSnapshot = await getDocs(classesCollection);

    return classesSnapshot.docs
      .filter(doc => classIds.includes(doc.id))
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Class',
          subject: data.subject || 'General',
          grade: data.grade || 'All',
          teacher: data.teacher || 'Unassigned',
          teacherId: data.teacherId || 'N/A',
          students: data.students || 0,
          maxStudents: data.maxStudents || 30,
          schedule: data.schedule || 'To be scheduled',
          room: data.room || 'TBD',
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          requestedAt: data.requestedAt
        } as Class;
      });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return [];
  }
};