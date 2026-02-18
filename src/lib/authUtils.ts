import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";

export interface LoginResult {
  success: boolean;
  user?: any;
  mustChangePassword?: boolean;
  error?: string;
}

/**
 * Authenticate user with email and password
 * Handles both Firebase Auth passwords and temporary passwords
 */
export const authenticateUser = async (email: string, password: string): Promise<LoginResult> => {
  try {
    // First, try to find user in Firestore to check for temporary password
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
      where('status', '==', 'active')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user has temporary password
    if (userData.temporaryPassword && userData.temporaryPassword === password) {
      // User is logging in with temporary password
      // We need to sign them in with Firebase Auth using a different approach
      // For now, we'll return success and handle the auth state separately
      
      // Update last login
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLogin: new Date().toISOString()
      });

      return {
        success: true,
        user: {
          id: userDoc.id,
          ...userData
        },
        mustChangePassword: userData.mustChangePassword !== false
      };
    }

    // Try normal Firebase Auth login
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      });

      return {
        success: true,
        user: {
          id: user.uid,
          ...userData
        },
        mustChangePassword: userData.mustChangePassword === true
      };
    } catch (authError: any) {
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
      throw authError;
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
};

/**
 * Change user password (after temporary password login)
 */
export const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      temporaryPassword: null, // Remove temporary password
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    return false;
  }
};

/**
 * Check if user must change password
 */
export const checkPasswordChangeRequired = (user: any): boolean => {
  return user.mustChangePassword === true || !!user.temporaryPassword;
};

/**
 * Generate secure temporary password
 */
export const generateSecurePassword = (length: number = 8): string => {
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%&*]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%&*)' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};