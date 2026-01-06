import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { enrollStudentInClass, fetchAllClasses } from "./classUtils";

/**
 * Auto-enroll students in classes for testing purposes
 * This function should be called once to set up initial enrollments
 */
export const setupInitialEnrollments = async (): Promise<void> => {
  try {
    console.log('Setting up initial enrollments...');
    
    // Get all active classes
    const classes = await fetchAllClasses();
    const activeClasses = classes.filter(c => c.status === 'active');
    
    if (activeClasses.length === 0) {
      console.log('No active classes found');
      return;
    }

    // Get all students
    const usersCollection = collection(db, 'users');
    const studentsQuery = query(usersCollection, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    if (studentsSnapshot.empty) {
      console.log('No students found');
      return;
    }

    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      displayName: doc.data().displayName
    }));

    console.log(`Found ${students.length} students and ${activeClasses.length} classes`);

    // Enroll each student in the first few classes (for testing)
    let enrollmentCount = 0;
    for (const cls of activeClasses.slice(0, 3)) { // Limit to first 3 classes
      for (const student of students.slice(0, 10)) { // Limit to first 10 students per class
        try {
          await enrollStudentInClass(cls.id, student.id, student.userId, student.displayName);
          enrollmentCount++;
          console.log(`✓ Enrolled ${student.displayName} in ${cls.name}`);
        } catch (error) {
          if (error.message.includes('already enrolled')) {
            console.log(`- ${student.displayName} already enrolled in ${cls.name}`);
          } else {
            console.error(`✗ Failed to enroll ${student.displayName} in ${cls.name}:`, error);
          }
        }
      }
    }

    console.log(`Enrollment setup complete. Created ${enrollmentCount} new enrollments.`);
  } catch (error) {
    console.error('Error setting up enrollments:', error);
    throw error;
  }
};

/**
 * Check if enrollments exist for any class
 */
export const checkEnrollmentsExist = async (): Promise<boolean> => {
  try {
    const enrollmentsCollection = collection(db, 'enrollments');
    const enrollmentsSnapshot = await getDocs(enrollmentsCollection);
    return !enrollmentsSnapshot.empty;
  } catch (error) {
    console.error('Error checking enrollments:', error);
    return false;
  }
};