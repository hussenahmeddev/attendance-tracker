import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Initialize counters if they don't exist
export const initializeCounters = async () => {
  const counterRef = doc(db, 'counters', 'userCounters');
  const counterDoc = await getDoc(counterRef);
  
  if (!counterDoc.exists()) {
    await setDoc(counterRef, {
      admin: 0,
      teacher: 0,
      student: 0
    });
  }
};

// Get user role display name
export const getRoleDisplayName = (role: string): string => {
  const roleNames = {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student'
  };
  return roleNames[role as keyof typeof roleNames] || role;
};

// Get role color for UI
export const getRoleColor = (role: string): string => {
  const roleColors = {
    admin: 'text-red-600 bg-red-50 border-red-200',
    teacher: 'text-blue-600 bg-blue-50 border-blue-200',
    student: 'text-green-600 bg-green-50 border-green-200'
  };
  return roleColors[role as keyof typeof roleColors] || 'text-gray-600 bg-gray-50 border-gray-200';
};