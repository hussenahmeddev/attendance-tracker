import { collection, getDocs, doc, setDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export const fixUserCounters = async () => {
  try {
    // Get all users from the database
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Count users by role
    const roleCounts = {
      admin: 0,
      teacher: 0,
      student: 0
    };

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const role = userData.role;
      console.log(`User ${userData.displayName || userData.email}: role = "${role}"`);
      if (role && roleCounts.hasOwnProperty(role)) {
        roleCounts[role as keyof typeof roleCounts]++;
      } else {
        console.warn(`Invalid or missing role for user ${userData.displayName || userData.email}: "${role}"`);
      }
    });

    // Update the counters document
    const counterRef = doc(db, 'counters', 'userIds');
    await setDoc(counterRef, roleCounts, { merge: true });

    console.log('Counters fixed:', roleCounts);
    return roleCounts;
  } catch (error) {
    console.error('Error fixing counters:', error);
    throw error;
  }
};

export const regenerateUserIds = async () => {
  try {
    // Get all users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Group users by role
    const usersByRole = {
      admin: [] as any[],
      teacher: [] as any[],
      student: [] as any[]
    };

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const role = userData.role;
      if (role && usersByRole.hasOwnProperty(role)) {
        usersByRole[role as keyof typeof usersByRole].push({
          id: doc.id,
          ...userData
        });
      }
    });

    // Sort users by creation date to maintain order
    Object.keys(usersByRole).forEach(role => {
      usersByRole[role as keyof typeof usersByRole].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA.getTime() - dateB.getTime();
      });
    });

    // Regenerate user IDs
    const rolePrefix = {
      admin: 'ADM',
      teacher: 'TCH',
      student: 'STD'
    };

    const updates: Promise<void>[] = [];

    Object.keys(usersByRole).forEach(role => {
      const users = usersByRole[role as keyof typeof usersByRole];
      users.forEach((user, index) => {
        const prefix = rolePrefix[role as keyof typeof rolePrefix];
        const number = (index + 1).toString().padStart(3, '0');
        const newUserId = `${prefix}${number}`;

        // Only update if the userId is different
        if (user.userId !== newUserId) {
          const userRef = doc(db, 'users', user.id);
          updates.push(setDoc(userRef, { ...user, userId: newUserId }, { merge: true }));
        }
      });
    });

    // Execute all updates
    await Promise.all(updates);

    // Update counters
    const newCounters = {
      admin: usersByRole.admin.length,
      teacher: usersByRole.teacher.length,
      student: usersByRole.student.length
    };

    const counterRef = doc(db, 'counters', 'userIds');
    await setDoc(counterRef, newCounters, { merge: true });

    console.log('User IDs regenerated and counters updated:', newCounters);
    return newCounters;
  } catch (error) {
    console.error('Error regenerating user IDs:', error);
    throw error;
  }
};