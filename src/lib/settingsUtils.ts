import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface SystemSettings {
    general: {
        school_name: string;
        academic_year: string;
        timezone: string;
        language: string;
    };
    attendance: {
        auto_mark_absent: boolean;
        attendance_window: string;
        late_threshold: string;
        require_reason: boolean;
    };
    notifications: {
        email_notifications: boolean;
        parent_notifications: boolean;
        low_attendance_alert: boolean;
        attendance_threshold: string;
    };
}

const SETTINGS_DOC_ID = 'system_config';

export const defaultSettings: SystemSettings = {
    general: {
        school_name: 'Springfield High School',
        academic_year: '2024-2025',
        timezone: 'GMT+03:00 East African Time',
        language: 'English',
    },
    attendance: {
        auto_mark_absent: true,
        attendance_window: '15',
        late_threshold: '10',
        require_reason: false,
    },
    notifications: {
        email_notifications: true,
        parent_notifications: true,
        low_attendance_alert: true,
        attendance_threshold: '75',
    }
};

/**
 * Fetch system settings from Firestore
 */
export const fetchSystemSettings = async (): Promise<SystemSettings> => {
    try {
        const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
            return settingsSnap.data() as SystemSettings;
        } else {
            // If settings don't exist, create them with defaults
            await setDoc(settingsRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Error fetching system settings:", error);
        return defaultSettings;
    }
};

/**
 * Update system settings in Firestore
 */
export const updateSystemSettings = async (settings: SystemSettings): Promise<void> => {
    try {
        const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
        await setDoc(settingsRef, settings);
    } catch (error) {
        console.error("Error updating system settings:", error);
        throw error;
    }
};

/**
 * Subscribe to system settings (Real-time)
 */
export const subscribeToSystemSettings = (callback: (settings: SystemSettings) => void) => {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);

    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as SystemSettings);
        } else {
            callback(defaultSettings);
        }
    }, (error) => {
        console.error("Error in system settings snapshot:", error);
    });
};
