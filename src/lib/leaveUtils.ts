import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { saveAttendanceRecord } from "./attendanceUtils";

export interface LeaveRequest {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail?: string;
    teacherId?: string;
    teacherName?: string;
    classId?: string;
    className?: string;
    section?: string;
    type: 'Sick' | 'Personal' | 'Emergency' | 'Other';
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
    attachmentName?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    cancelledAt?: string;
    cancelReason?: string;
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
        
        // Create notification for teacher
        if (request.teacherId) {
            await createLeaveNotification({
                recipientId: request.teacherId,
                recipientRole: 'teacher',
                type: 'leave_request_submitted',
                title: 'New Leave Request',
                message: `${request.studentName} has submitted a leave request`,
                leaveRequestId: docRef.id,
                studentId: request.studentId
            });
        }
        
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
 * Subscribe to leave requests for a specific teacher (Real-time)
 */
export const subscribeToTeacherLeaveRequests = (teacherId: string, callback: (requests: LeaveRequest[]) => void) => {
    const leaveCollection = collection(db, 'leaveRequests');
    const q = query(
        leaveCollection,
        where('teacherId', '==', teacherId),
        orderBy('submittedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LeaveRequest));
        callback(requests);
    }, (error) => {
        console.error("Error in teacher leave requests snapshot:", error);
        // Fallback if index missing
        const qSimple = query(leaveCollection, where('teacherId', '==', teacherId));
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
 * Update leave request (for editing before approval)
 */
export const updateLeaveRequest = async (
    requestId: string,
    updates: Partial<Pick<LeaveRequest, 'type' | 'startDate' | 'endDate' | 'reason' | 'attachmentUrl' | 'attachmentName'>>
): Promise<void> => {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        const requestDoc = await getDoc(requestRef);
        
        if (!requestDoc.exists()) {
            throw new Error('Leave request not found');
        }
        
        const requestData = requestDoc.data() as LeaveRequest;
        
        // Only allow editing if status is pending
        if (requestData.status !== 'pending') {
            throw new Error('Cannot edit a leave request that has been reviewed');
        }
        
        await updateDoc(requestRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating leave request:", error);
        throw error;
    }
};

/**
 * Cancel leave request
 */
export const cancelLeaveRequest = async (
    requestId: string,
    cancelReason?: string
): Promise<void> => {
    try {
        const requestRef = doc(db, 'leaveRequests', requestId);
        const requestDoc = await getDoc(requestRef);
        
        if (!requestDoc.exists()) {
            throw new Error('Leave request not found');
        }
        
        const requestData = requestDoc.data() as LeaveRequest;
        
        // Only allow cancelling if status is pending
        if (requestData.status !== 'pending') {
            throw new Error('Cannot cancel a leave request that has been reviewed');
        }
        
        await updateDoc(requestRef, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelReason: cancelReason || 'Cancelled by student'
        });
        
        // Notify teacher
        if (requestData.teacherId) {
            await createLeaveNotification({
                recipientId: requestData.teacherId,
                recipientRole: 'teacher',
                type: 'leave_request_cancelled',
                title: 'Leave Request Cancelled',
                message: `${requestData.studentName} has cancelled their leave request`,
                leaveRequestId: requestId,
                studentId: requestData.studentId
            });
        }
    } catch (error) {
        console.error("Error cancelling leave request:", error);
        throw error;
    }
};

/**
 * Delete leave request (admin only)
 */
export const deleteLeaveRequest = async (requestId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'leaveRequests', requestId));
    } catch (error) {
        console.error("Error deleting leave request:", error);
        throw error;
    }
};

/**
 * Get student's assigned teacher
 */
export const getStudentAssignedTeacher = async (studentId: string): Promise<{ teacherId: string; teacherName: string; classId?: string; className?: string } | null> => {
    try {
        // Check enrollments to find student's class and teacher
        const enrollmentsQuery = query(
            collection(db, 'enrollments'),
            where('studentId', '==', studentId)
        );
        
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        
        if (enrollmentsSnapshot.empty) {
            return null;
        }
        
        // Get the first enrollment (primary class)
        const enrollment = enrollmentsSnapshot.docs[0].data();
        const classId = enrollment.classId;
        
        // Get class details to find teacher
        const classDoc = await getDoc(doc(db, 'classes', classId));
        
        if (!classDoc.exists()) {
            return null;
        }
        
        const classData = classDoc.data();
        
        return {
            teacherId: classData.teacherId,
            teacherName: classData.teacherName,
            classId: classId,
            className: classData.name
        };
    } catch (error) {
        console.error("Error getting student's assigned teacher:", error);
        return null;
    }
};

/**
 * Create notification for leave request
 */
interface LeaveNotification {
    recipientId: string;
    recipientRole: 'student' | 'teacher' | 'admin';
    type: 'leave_request_submitted' | 'leave_request_approved' | 'leave_request_rejected' | 'leave_request_cancelled';
    title: string;
    message: string;
    leaveRequestId: string;
    studentId?: string;
    teacherId?: string;
}

const createLeaveNotification = async (notification: LeaveNotification): Promise<void> => {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        // Don't throw - notifications are optional
    }
};

/**
 * Get leave statistics for a student
 */
export const getStudentLeaveStatistics = async (studentId: string): Promise<{
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    totalLeaveDays: number;
}> => {
    try {
        const requests = await fetchStudentLeaveRequests(studentId);
        
        const totalRequests = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        const cancelled = requests.filter(r => r.status === 'cancelled').length;
        
        // Calculate total leave days from approved requests
        const totalLeaveDays = requests
            .filter(r => r.status === 'approved')
            .reduce((total, request) => {
                const start = new Date(request.startDate);
                const end = new Date(request.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return total + days;
            }, 0);
        
        return {
            totalRequests,
            pending,
            approved,
            rejected,
            cancelled,
            totalLeaveDays
        };
    } catch (error) {
        console.error("Error getting student leave statistics:", error);
        throw error;
    }
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
        const requestDoc = await getDoc(requestRef);
        
        if (!requestDoc.exists()) {
            throw new Error('Leave request not found');
        }
        
        const requestData = requestDoc.data() as LeaveRequest;
        
        // Update leave request status
        await updateDoc(requestRef, {
            status,
            reviewedBy,
            comments: comments || '',
            reviewedAt: new Date().toISOString()
        });
        
        // If approved, automatically update attendance records
        if (status === 'approved') {
            await updateAttendanceForApprovedLeave(requestData);
        }
        
        // Create notification for student
        await createLeaveNotification({
            recipientId: requestData.studentId,
            recipientRole: 'student',
            type: status === 'approved' ? 'leave_request_approved' : 'leave_request_rejected',
            title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your leave request from ${new Date(requestData.startDate).toLocaleDateString()} to ${new Date(requestData.endDate).toLocaleDateString()} has been ${status}`,
            leaveRequestId: requestId,
            teacherId: reviewedBy
        });
        
    } catch (error) {
        console.error("Error updating leave request status:", error);
        throw error;
    }
};

/**
 * Update attendance records for approved leave
 */
const updateAttendanceForApprovedLeave = async (leaveRequest: LeaveRequest): Promise<void> => {
    try {
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        
        // Loop through each date in the leave period
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            // Skip weekends (optional - adjust based on your school's schedule)
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            // Create or update attendance record as "excused"
            await saveAttendanceRecord({
                classId: leaveRequest.classId || 'general',
                className: leaveRequest.className || 'General',
                teacherId: leaveRequest.teacherId || 'system',
                teacherName: leaveRequest.teacherName || 'System',
                studentId: leaveRequest.studentId,
                studentName: leaveRequest.studentName,
                date: dateString,
                status: 'excused',
                notes: `Approved leave: ${leaveRequest.type} - ${leaveRequest.reason}`,
                markedAt: new Date().toISOString()
            });
        }
        
        console.log(`Updated attendance records for approved leave: ${leaveRequest.id}`);
    } catch (error) {
        console.error("Error updating attendance for approved leave:", error);
        // Don't throw - leave approval should succeed even if attendance update fails
    }
};
