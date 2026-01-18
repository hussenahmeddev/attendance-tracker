import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface LeaveRequest {
    id: string;
    studentId: string;
    studentName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
}

/**
 * Submit a new leave request
 */
export const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>): Promise<string> => {
    try {
        const leaveCollection = collection(db, 'leaveRequests');
        const docRef = await addDoc(leaveCollection, {
            ...request,
            status: 'pending',
            submittedAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error submitting leave request:", error);
        throw error;
    }
};

/**
 * Fetch leave requests for a specific student
 */
export const fetchStudentLeaveRequests = async (studentId: string): Promise<LeaveRequest[]> => {
    try {
        const leaveCollection = collection(db, 'leaveRequests');
        const q = query(
            leaveCollection,
            where('studentId', '==', studentId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest));
    } catch (error) {
        console.error("Error fetching student leave requests:", error);
        // Fallback if index is not ready
        const leaveCollection = collection(db, 'leaveRequests');
        const q = query(leaveCollection, where('studentId', '==', studentId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest)).sort((a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
    }
};

/**
 * Fetch pending leave requests for a teacher (based on their classes)
 * NOTE: For simplicity, this fetches ALL pending requests and we filter in memory
 * OR you can implement a more complex query if student IDs are known.
 */
export const fetchAllLeaveRequests = async (): Promise<LeaveRequest[]> => {
    try {
        const leaveCollection = collection(db, 'leaveRequests');
        const q = query(leaveCollection, orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest));
    } catch (error) {
        console.error("Error fetching all leave requests:", error);
        const leaveCollection = collection(db, 'leaveRequests');
        const snapshot = await getDocs(leaveCollection);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest)).sort((a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
    }
};

/**
 * Subscribe to leave requests for a specific student (Real-time)
 */
export const subscribeToStudentLeaveRequests = (studentId: string, callback: (requests: LeaveRequest[]) => void) => {
    const leaveCollection = collection(db, 'leaveRequests');
    const q = query(
        leaveCollection,
        where('studentId', '==', studentId),
        orderBy('submittedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest));
        callback(requests);
    }, (error) => {
        console.error("Error in leave requests snapshot:", error);
        // Fallback if index missing
        const qSimple = query(leaveCollection, where('studentId', '==', studentId));
        return onSnapshot(qSimple, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LeaveRequest)).sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
            callback(requests);
        });
    });
};

/**
 * Subscribe to all leave requests (Real-time for Teacher/Admin)
 */
export const subscribeToAllLeaveRequests = (callback: (requests: LeaveRequest[]) => void) => {
    const leaveCollection = collection(db, 'leaveRequests');
    const q = query(leaveCollection, orderBy('submittedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest));
        callback(requests);
    }, (error) => {
        console.error("Error in all leave requests snapshot:", error);
        // Fallback if index missing
        return onSnapshot(leaveCollection, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LeaveRequest)).sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
            callback(requests);
        });
    });
};

/**
 * Update the status of a leave request
 */
export const updateLeaveRequestStatus = async (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    comments?: string
): Promise<void> => {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        await updateDoc(requestRef, {
            status,
            reviewedBy,
            comments: comments || '',
            reviewedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating leave request status:", error);
        throw error;
    }
};
