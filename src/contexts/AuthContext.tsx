import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, runTransaction, collection } from 'firebase/firestore';
import { auth, db, getSecondaryApp } from '@/lib/firebase';

interface UserData {
  uid: string;
  userId: string; // Auto-increment ID like ADM001, TCH001, STD001
  email: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'student';
  section?: string; // Section field for students/teachers
  status: 'active' | 'deactivate';
  mustChangePassword?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  createUser: (email: string, password: string, name: string, role: string, section?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserData>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Function to generate auto-increment user ID
const generateUserId = async (role: string): Promise<string> => {
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in test mode
  const isTestMode = window.location.search.includes('test=true');

  // Use the secondary app for creating users to avoid logging out the admin
  const createUser = async (email: string, password: string, name: string, role: string, section?: string) => {
    const secondaryApp = getSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);

    // Create user in authentication
    const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password);

    // Update the user's display name
    await updateProfile(user, { displayName: name });

    // Generate auto-increment user ID
    const userId = await generateUserId(role);

    // Store additional user data in Firestore
    const userDocData: UserData = {
      uid: user.uid,
      userId: userId, // Auto-increment ID like ADM001, TCH001, STD001
      email: user.email!,
      displayName: name,
      role: role as 'admin' | 'teacher' | 'student',
      section: section, // Add section field
      status: 'active', // Default status is active
      mustChangePassword: true, // Force password change for new users
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), userDocData);

    // Sign out from the secondary app so it doesn't interfere
    await signOut(secondaryAuth);
  };

  const signIn = async (email: string, password: string): Promise<UserData> => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserData;

      // Check status
      if (data.status === 'deactivate') {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      setUserData(data);
      return data;
    } else {
      // If user exists in Auth but not in Firestore, create basic data or error
      // For now error as we expect admin to create users
      throw new Error('User data not found');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  useEffect(() => {
    // If in test mode, set mock data based on current route
    if (isTestMode) {
      const path = window.location.pathname;
      let mockRole: 'admin' | 'teacher' | 'student' = 'student';

      if (path.includes('/admin')) mockRole = 'admin';
      else if (path.includes('/teacher')) mockRole = 'teacher';
      else if (path.includes('/student')) mockRole = 'student';

      const mockUserData: UserData = {
        uid: 'test-user',
        userId: mockRole === 'admin' ? 'ADM001' : mockRole === 'teacher' ? 'TCH001' : 'STD001',
        email: `test@${mockRole}.com`,
        displayName: `Test ${mockRole.charAt(0).toUpperCase()}${mockRole.slice(1)}`,
        role: mockRole,
        status: 'active',
        mustChangePassword: false,
      };

      setCurrentUser({ uid: 'test-user' } as User);
      setUserData(mockUserData);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          // Get user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data() as UserData;
              // Check status on persistent login too
              if (data.status === 'deactivate') {
                await signOut(auth);
                setUserData(null);
                setCurrentUser(null);
                return;
              }
              setUserData(data);
            } else {
              console.error('User document not found in Firestore');
              setUserData(null);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setUserData(null);
          }
        } else {
          setCurrentUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    // Set a timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [isTestMode]);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    createUser,
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && !isTestMode ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};