import { collection, addDoc, getDocs, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    endTime?: string;
    type: 'holiday' | 'exam' | 'event' | 'break' | 'system' | 'class' | 'schedule_change';
    location?: string;
    classId?: string;
    className?: string;
    teacherId?: string;
    teacherName?: string;
    affectedUsers?: string[]; // User IDs affected by this event
    isRecurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly';
    recurringEndDate?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'cancelled' | 'postponed' | 'completed';
    createdAt: string;
    updatedAt?: string;
    createdBy: string;
}

export interface ClassSchedule {
    id: string;
    classId: string;
    className: string;
    teacherId: string;
    teacherName: string;
    subject: string;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string;
    endTime: string;
    room: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo?: string;
    createdAt: string;
}

export interface ScheduleChange {
    id: string;
    originalScheduleId: string;
    changeType: 'cancelled' | 'rescheduled' | 'room_change' | 'teacher_change';
    originalDate: string;
    newDate?: string;
    originalTime?: string;
    newTime?: string;
    originalRoom?: string;
    newRoom?: string;
    originalTeacher?: string;
    newTeacher?: string;
    reason: string;
    affectedUsers: string[];
    notificationSent: boolean;
    createdAt: string;
    createdBy: string;
}

/**
 * Add a new event to the academic calendar
 */
export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const eventsCollection = collection(db, 'calendarEvents');
        const docRef = await addDoc(eventsCollection, {
            ...event,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // If this affects users, create notifications
        if (event.affectedUsers && event.affectedUsers.length > 0) {
            await createEventNotifications(docRef.id, event);
        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding calendar event:", error);
        throw error;
    }
};

/**
 * Create notifications for affected users
 */
const createEventNotifications = async (eventId: string, event: Partial<CalendarEvent>) => {
    try {
        const batch = writeBatch(db);
        const notificationsCollection = collection(db, 'notifications');

        event.affectedUsers?.forEach(userId => {
            const notificationRef = doc(notificationsCollection);
            batch.set(notificationRef, {
                userId,
                eventId,
                type: 'calendar_event',
                title: `New ${event.type}: ${event.title}`,
                message: event.description,
                isRead: false,
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error creating event notifications:", error);
    }
};

/**
 * Add a class schedule
 */
export const addClassSchedule = async (schedule: Omit<ClassSchedule, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const schedulesCollection = collection(db, 'classSchedules');
        const docRef = await addDoc(schedulesCollection, {
            ...schedule,
            createdAt: new Date().toISOString()
        });

        // Create calendar events for recurring class sessions
        await createRecurringClassEvents(docRef.id, schedule);

        return docRef.id;
    } catch (error) {
        console.error("Error adding class schedule:", error);
        throw error;
    }
};

/**
 * Create recurring calendar events for class sessions
 */
const createRecurringClassEvents = async (scheduleId: string, schedule: Omit<ClassSchedule, 'id' | 'createdAt'>) => {
    try {
        const startDate = new Date(schedule.effectiveFrom);
        const endDate = schedule.effectiveTo ? new Date(schedule.effectiveTo) : new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year default

        const events: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            if (date.getDay() === schedule.dayOfWeek) {
                events.push({
                    title: `${schedule.className} - ${schedule.subject}`,
                    description: `Regular class session`,
                    date: date.toISOString().split('T')[0],
                    time: schedule.startTime,
                    endTime: schedule.endTime,
                    type: 'class',
                    location: schedule.room,
                    classId: schedule.classId,
                    className: schedule.className,
                    teacherId: schedule.teacherId,
                    teacherName: schedule.teacherName,
                    priority: 'medium',
                    status: 'active',
                    createdBy: 'system'
                });
            }
        }

        // Batch create events
        const batch = writeBatch(db);
        const eventsCollection = collection(db, 'calendarEvents');
        
        events.forEach(event => {
            const eventRef = doc(eventsCollection);
            batch.set(eventRef, {
                ...event,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error creating recurring class events:", error);
    }
};

/**
 * Create a schedule change and propagate to affected users
 */
export const createScheduleChange = async (change: Omit<ScheduleChange, 'id' | 'createdAt' | 'notificationSent'>): Promise<string> => {
    try {
        const changesCollection = collection(db, 'scheduleChanges');
        const docRef = await addDoc(changesCollection, {
            ...change,
            createdAt: new Date().toISOString(),
            notificationSent: false
        });

        // Create calendar event for the change
        await addCalendarEvent({
            title: `Schedule Change: ${change.changeType}`,
            description: `${change.reason}`,
            date: change.newDate || change.originalDate,
            time: change.newTime || change.originalTime || '00:00',
            type: 'schedule_change',
            affectedUsers: change.affectedUsers,
            priority: 'high',
            status: 'active',
            createdBy: change.createdBy
        });

        // Send notifications to affected users
        await propagateScheduleChange(docRef.id, change);

        return docRef.id;
    } catch (error) {
        console.error("Error creating schedule change:", error);
        throw error;
    }
};

/**
 * Propagate schedule changes to teacher and student dashboards
 */
const propagateScheduleChange = async (changeId: string, change: Omit<ScheduleChange, 'id' | 'createdAt' | 'notificationSent'>) => {
    try {
        const batch = writeBatch(db);
        const notificationsCollection = collection(db, 'notifications');

        // Create notifications for all affected users
        change.affectedUsers.forEach(userId => {
            const notificationRef = doc(notificationsCollection);
            batch.set(notificationRef, {
                userId,
                changeId,
                type: 'schedule_change',
                title: `Schedule Change: ${change.changeType}`,
                message: change.reason,
                originalDate: change.originalDate,
                newDate: change.newDate,
                originalTime: change.originalTime,
                newTime: change.newTime,
                isRead: false,
                priority: 'high',
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();

        // Mark notifications as sent
        const changeRef = doc(db, 'scheduleChanges', changeId);
        await updateDoc(changeRef, { notificationSent: true });

    } catch (error) {
        console.error("Error propagating schedule change:", error);
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
 * Fetch class schedules
 */
export const fetchClassSchedules = async (): Promise<ClassSchedule[]> => {
    try {
        const schedulesCollection = collection(db, 'classSchedules');
        const q = query(schedulesCollection, where('isActive', '==', true), orderBy('dayOfWeek', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ClassSchedule));
    } catch (error) {
        console.error("Error fetching class schedules:", error);
        throw error;
    }
};

/**
 * Fetch schedule changes
 */
export const fetchScheduleChanges = async (): Promise<ScheduleChange[]> => {
    try {
        const changesCollection = collection(db, 'scheduleChanges');
        const q = query(changesCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ScheduleChange));
    } catch (error) {
        console.error("Error fetching schedule changes:", error);
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
 * Subscribe to class schedules (Real-time)
 */
export const subscribeToClassSchedules = (callback: (schedules: ClassSchedule[]) => void) => {
    const schedulesCollection = collection(db, 'classSchedules');
    const q = query(schedulesCollection, where('isActive', '==', true), orderBy('dayOfWeek', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const schedules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ClassSchedule));
        callback(schedules);
    }, (error) => {
        console.error("Error in class schedules snapshot:", error);
    });
};

/**
 * Subscribe to schedule changes (Real-time)
 */
export const subscribeToScheduleChanges = (callback: (changes: ScheduleChange[]) => void) => {
    const changesCollection = collection(db, 'scheduleChanges');
    const q = query(changesCollection, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const changes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ScheduleChange));
        callback(changes);
    }, (error) => {
        console.error("Error in schedule changes snapshot:", error);
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
