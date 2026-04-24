import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fix class student counters by recalculating from actual enrollments
 */
export const fixClassStudentCounters = async (): Promise<void> => {
  try {
    console.log('Starting to fix class student counters...');

    // Get all classes
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Get all active enrollments
    const enrollmentsSnapshot = await getDocs(
      query(collection(db, 'enrollments'), where('status', '==', 'active'))
    );
    const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data() as any);

    // Count enrollments per class
    const enrollmentCounts = new Map<string, number>();
    enrollments.forEach(enrollment => {
      const classId = enrollment.classId;
      enrollmentCounts.set(classId, (enrollmentCounts.get(classId) || 0) + 1);
    });

    // Update each class with correct student count
    for (const classDoc of classes) {
      const correctCount = enrollmentCounts.get(classDoc.id) || 0;
      const currentCount = classDoc.students || 0;

      if (correctCount !== currentCount) {
        console.log(`Fixing class ${classDoc.name}: ${currentCount} → ${correctCount}`);
        await updateDoc(doc(db, 'classes', classDoc.id), {
          students: correctCount
        });
      }
    }

    console.log('Class student counters fixed successfully!');
  } catch (error) {
    console.error('Error fixing class student counters:', error);
    throw error;
  }
};

/**
 * Get enrollment statistics for debugging
 */
export const getEnrollmentStats = async () => {
  try {
    const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const activeEnrollments = enrollments.filter(e => e.status === 'active');

    console.log('Total enrollments:', enrollments.length);
    console.log('Active enrollments:', activeEnrollments.length);
    console.log('Enrollments by class:',
      activeEnrollments.reduce((acc, e) => {
        acc[e.classId] = (acc[e.classId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );

    return {
      total: enrollments.length,
      active: activeEnrollments.length,
      byClass: activeEnrollments.reduce((acc, e) => {
        acc[e.classId] = (acc[e.classId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    console.error('Error getting enrollment stats:', error);
    throw error;
  }
};

/**
 * Fix user counters (stub implementation to satisfy imports)
 */
export const fixUserCounters = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data()).filter(u => !u.deleted);

    const counters = {
      admin: users.filter(u => u.role === 'admin').length,
      teacher: users.filter(u => u.role === 'teacher').length,
      student: users.filter(u => u.role === 'student').length
    };

    // In a real implementation, we might save these to a 'stats' document
    // const statsRef = doc(db, 'system', 'stats');
    // await updateDoc(statsRef, counters);

    return counters;
  } catch (error) {
    console.error('Error fixing user counters:', error);
    throw error;
  }
};

/**
 * Regenerate user IDs (stub implementation to satisfy imports)
 */
export const regenerateUserIds = async () => {
  console.warn("regenerateUserIds is not fully implemented yet.");
  // Return dummy counts to satisfy SystemUtils expectation
  return { admin: 0, teacher: 0, student: 0 };
};
