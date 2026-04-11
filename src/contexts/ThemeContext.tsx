import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { userData } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");
  const [isLoading, setIsLoading] = useState(true);

  // Load user's theme preference from Firestore
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!userData?.userId) {
        // If no user, use light theme as default
        setThemeState("light");
        setIsLoading(false);
        return;
      }

      try {
        const themeDoc = await getDoc(
          doc(db, "userPreferences", userData.userId)
        );

        if (themeDoc.exists()) {
          const savedTheme = themeDoc.data().theme as Theme;
          // Ensure only light or dark (convert system to light if exists)
          setThemeState(savedTheme === "dark" ? "dark" : "light");
        } else {
          // No saved preference, use light theme
          setThemeState("light");
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
        // Fallback to light theme
        setThemeState("light");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserTheme();
  }, [userData?.userId]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Set theme and save to Firestore
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Save to Firestore if user is logged in
    if (userData?.userId) {
      try {
        await setDoc(
          doc(db, "userPreferences", userData.userId),
          {
            theme: newTheme,
            userId: userData.userId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
