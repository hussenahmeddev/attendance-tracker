import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, runTransaction, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  userId: string; // Auto-increment ID like ADM001, TCH001, STD001
  email: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
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
  const counterRef = doc(db, 'counters', 'userCounters');
  
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

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(user, { displayName: name });
    
    // Generate auto-increment user ID
    const userId = await generateUserId(role);
    
    // Store additional user data in Firestore
    const userDocData = {
      uid: user.uid,
      userId: userId, // Auto-increment ID like ADM001, TCH001, STD001
      email: user.email!,
      displayName: name,
      role: role as 'admin' | 'teacher' | 'student',
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userDocData);
    setUserData(userDocData);
  };

  const signIn = async (email: string, password: string): Promise<UserData> => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      setUserData(userData);
      return userData;
    } else {
      throw new Error('User data not found');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        // Get user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
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
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};