import { doc, updateDoc, getDoc, runTransaction, collection, getDocs, query, where, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getSecondaryApp } from './firebase';

// Enhanced user management interfaces
export interface UserAssignment {
  id: string;
  userId: string;
  classId: string;
  className: string;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive';
}

export interface BulkUserData {
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  section?: string;
  department?: string;
  phone?: string;
  password?: string;
}

// Function to reset a user's password (admin only)
export const resetUserPassword = async (userId: string, newPassword: string, adminId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Update user document with password reset flags
    await updateDoc(userRef, {
      mustChangePassword: true,
      passwordResetAt: new Date().toISOString(),
      passwordResetBy: adminId,
      temporaryPassword: newPassword, // In production, this should be hashed
      updatedAt: new Date().toISOString()
    });

    console.log(`Password reset for user ${userId}`);
    return { success: true };

  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message };
  }
};

// Function to force password change for a user
export const forcePasswordChange = async (userId: string, adminId: string) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      mustChangePassword: true,
      passwordChangeForced: true,
      passwordChangeForcedAt: new Date().toISOString(),
      passwordChangeForcedBy: adminId,
      updatedAt: new Date().toISOString()
    });

    return { success: true };

  } catch (error) {
    console.error('Error forcing password change:', error);
    return { success: false, error: error.message };
  }
};

// Function to update a user's role and regenerate their ID
export const updateUserRole = async (userId: string, newRole: 'admin' | 'teacher' | 'student') => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Generate new user ID based on new role
    const newUserId = await generateNewUserId(newRole);

    // Update user document
    await updateDoc(userRef, {
      role: newRole,
      userId: newUserId,
      updatedAt: new Date().toISOString()
    });

    console.log(`User ${userData.displayName} updated to ${newRole} with ID ${newUserId}`);
    return { success: true, newUserId };

  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
};

// Generate new user ID for role change
const generateNewUserId = async (role: string): Promise<string> => {
  const counterRef = doc(db, 'counters', 'userIds');

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let counters = {
      admin: 0,
      teacher: 0,
      student: 0
    };

    if (counterDoc.exists()) {
      counters = counterDoc.data() as typeof counters;
    }

    // Increment the counter for the specific role
    counters[role as keyof typeof counters] += 1;

    // Update the counter document
    transaction.set(counterRef, counters, { merge: true });

    // Generate the user ID based on role
    const rolePrefix = {
      admin: 'ADM',
      teacher: 'TCH',
      student: 'STD'
    };

    const prefix = rolePrefix[role as keyof typeof rolePrefix];
    const number = counters[role as keyof typeof counters].toString().padStart(3, '0');

    return `${prefix}${number}`;
  });
};

// Function to fix specific user (for miftah's case)
export const fixMiftahRole = async () => {
  try {
    // You would need to find miftah's Firebase UID first
    // This is a helper function for the specific case
    console.log('To fix miftah\'s role, you need to:');
    console.log('1. Find their Firebase UID from the Firebase console');
    console.log('2. Call updateUserRole(firebaseUID, "teacher")');
    console.log('3. Or delete and recreate the account with a teacher-indicating email');
  } catch (error) {
    console.error('Error:', error);
  }
};



// Function to assign students to classes
export const assignStudentToClass = async (studentId: string, classId: string, adminId: string) => {
  try {
    // Check if assignment already exists
    const assignmentsCollection = collection(db, 'enrollments');
    const existingQuery = query(
      assignmentsCollection,
      where('studentId', '==', studentId),
      where('classId', '==', classId),
      where('status', '==', 'active')
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error('Student is already assigned to this class');
    }

    // Get student and class details
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    const classDoc = await getDoc(doc(db, 'classes', classId));

    if (!studentDoc.exists() || !classDoc.exists()) {
      throw new Error('Student or class not found');
    }

    const studentData = studentDoc.data();
    const classData = classDoc.data();

    // Create assignment record
    const assignment = {
      studentId,
      studentUserId: studentData.userId,
      studentName: studentData.displayName,
      classId,
      className: classData.name,
      enrolledAt: new Date().toISOString(),
      assignedBy: adminId,
      status: 'active'
    };

    await addDoc(assignmentsCollection, assignment);

    // Update class student count
    await updateDoc(doc(db, 'classes', classId), {
      students: (classData.students || 0) + 1
    });

    return { success: true };
  } catch (error) {
    console.error('Error assigning student to class:', error);
    return { success: false, error: error.message };
  }
};

// Function to assign teachers to classes
export const assignTeacherToClass = async (teacherId: string, classId: string, adminId: string) => {
  try {
    // Get teacher and class details
    const teacherDoc = await getDoc(doc(db, 'users', teacherId));
    const classDoc = await getDoc(doc(db, 'classes', classId));

    if (!teacherDoc.exists() || !classDoc.exists()) {
      throw new Error('Teacher or class not found');
    }

    const teacherData = teacherDoc.data();

    // Update class with teacher assignment
    await updateDoc(doc(db, 'classes', classId), {
      teacherId,
      teacher: teacherData.displayName,
      assignedAt: new Date().toISOString(),
      assignedBy: adminId
    });

    return { success: true };
  } catch (error) {
    console.error('Error assigning teacher to class:', error);
    return { success: false, error: error.message };
  }
};

// Function to get user assignments
export const getUserAssignments = async (userId: string, userRole: string): Promise<UserAssignment[]> => {
  try {
    if (userRole === 'student') {
      // Get student enrollments
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('studentId', '==', userId),
        where('status', '==', 'active')
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      return enrollmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          classId: data.classId,
          className: data.className || 'Unknown Class',
          assignedAt: data.enrolledAt,
          assignedBy: data.assignedBy || 'System',
          status: data.status
        };
      });
    } else if (userRole === 'teacher') {
      // Get teacher class assignments
      const classesQuery = query(
        collection(db, 'classes'),
        where('teacherId', '==', userId)
      );
      const classesSnapshot = await getDocs(classesQuery);

      return classesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          classId: doc.id,
          className: data.name || 'Unknown Class',
          assignedAt: data.assignedAt || data.createdAt,
          assignedBy: data.assignedBy || 'System',
          status: 'active'
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error getting user assignments:', error);
    return [];
  }
};

// Function to remove user assignment
export const removeUserAssignment = async (userId: string, classId: string, userRole: string) => {
  try {
    if (userRole === 'student') {
      // Remove student enrollment
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('studentId', '==', userId),
        where('classId', '==', classId),
        where('status', '==', 'active')
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const batch = writeBatch(db);
      enrollmentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Update class student count
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        const classData = classDoc.data();
        batch.update(doc(db, 'classes', classId), {
          students: Math.max(0, (classData.students || 0) - 1)
        });
      }

      await batch.commit();
    } else if (userRole === 'teacher') {
      // Remove teacher assignment
      await updateDoc(doc(db, 'classes', classId), {
        teacherId: '',
        teacher: 'Unassigned',
        assignedAt: null,
        assignedBy: null
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing user assignment:', error);
    return { success: false, error: error.message };
  }
};

// Function to bulk create users from CSV data
export const bulkCreateUsers = async (users: BulkUserData[], adminId: string) => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    const secondaryApp = getSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.name || !userData.email || !userData.role) {
          results.failed++;
          results.errors.push(`Missing required fields for ${userData.email || 'unknown'}`);
          continue;
        }

        // Generate password if not provided
        const password = userData.password || generateRandomPassword();

        // Create user in authentication
        const { user } = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);

        // Generate auto-increment user ID
        const userId = await generateNewUserId(userData.role);

        // Store user data in Firestore
        const userDocData = {
          uid: user.uid,
          userId: userId,
          email: userData.email,
          displayName: userData.name,
          role: userData.role,
          section: userData.section || '',
          department: userData.department || '',
          phone: userData.phone || '',
          status: 'active',
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
          createdBy: adminId
        };

        await addDoc(collection(db, 'users'), userDocData);

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to create ${userData.email}: ${error.message}`);
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error in bulk user creation:', error);
    return { success: false, error: error.message };
  }
};

// Function to generate random password
const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Function to export users to CSV format
export const exportUsersToCSV = async (): Promise<string> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data());

    const csvHeaders = ['User ID', 'Name', 'Email', 'Role', 'Section', 'Status', 'Created At'];
    const csvRows = users.map(user => [
      user.userId || 'N/A',
      user.displayName || 'Unknown',
      user.email || 'No email',
      user.role || 'student',
      user.section || '',
      user.status || 'active',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting users to CSV:', error);
    throw error;
  }
};

// Function to parse CSV content for bulk import
export const parseCSVForBulkImport = (csvContent: string): BulkUserData[] => {
  try {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

    const users: BulkUserData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());

      const user: BulkUserData = {
        name: '',
        email: '',
        role: 'student' as const
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';

        switch (header) {
          case 'name':
          case 'full name':
          case 'display name':
            user.name = value;
            break;
          case 'email':
          case 'email address':
            user.email = value;
            break;
          case 'role':
            if (['admin', 'teacher', 'student'].includes(value.toLowerCase())) {
              user.role = value.toLowerCase() as 'admin' | 'teacher' | 'student';
            }
            break;
          case 'section':
            user.section = value;
            break;
          case 'department':
            user.department = value;
            break;
          case 'phone':
          case 'phone number':
            user.phone = value;
            break;
          case 'password':
            user.password = value;
            break;
        }
      });

      if (user.name && user.email) {
        users.push(user);
      }
    }

    return users;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Invalid CSV format');
  }
};

