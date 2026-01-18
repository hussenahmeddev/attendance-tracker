import { collection, addDoc, getDocs, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'holiday' | 'exam' | 'event' | 'break' | 'system';
    location?: string;
    createdAt: string;
}

/**
 * Add a new event to the academic calendar
 */
export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const eventsCollection = collection(db, 'calendarEvents');
        const docRef = await addDoc(eventsCollection, {
            ...event,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding calendar event:", error);
        throw error;
    }
};

/**
 * Fetch all calendar events (one-time)
 */
export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
    try {
        const eventsCollection = collection(db, 'calendarEvents');
        const q = query(eventsCollection, orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CalendarEvent));
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
    }
};

/**
 * Subscribe to calendar events (Real-time)
 */
export const subscribeToCalendarEvents = (callback: (events: CalendarEvent[]) => void) => {
    const eventsCollection = collection(db, 'calendarEvents');
    const q = query(eventsCollection, orderBy('date', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CalendarEvent));
        callback(events);
    }, (error) => {
        console.error("Error in calendar events snapshot:", error);
    });
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
    try {
        const eventRef = doc(db, 'calendarEvents', eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        throw error;
    }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (eventId: string, data: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): Promise<void> => {
    try {
        const eventRef = doc(db, 'calendarEvents', eventId);
        await updateDoc(eventRef, data);
    } catch (error) {
        console.error("Error updating calendar event:", error);
        throw error;
    }
};
