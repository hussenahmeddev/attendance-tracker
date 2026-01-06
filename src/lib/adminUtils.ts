import { doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

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