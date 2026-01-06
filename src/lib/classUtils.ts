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