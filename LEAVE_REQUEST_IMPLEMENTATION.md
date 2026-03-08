# Leave Request Management System - Implementation Guide

## Overview
A comprehensive Leave Request Management module has been successfully integrated into the EduTrack Attendance Tracker System. This module enables students to submit leave requests to their assigned teachers, who can then approve or reject them. Approved leaves automatically update attendance records as "Excused Leave".

## Features Implemented

### 1. Student Dashboard Features
✅ **Leave Request Submission**
- Students can submit leave requests to their assigned teacher
- Form fields include:
  - Leave Type (Sick / Personal / Emergency / Other)
  - Start Date
  - End Date
  - Reason / Description
  - Optional File Attachment support (infrastructure ready)

✅ **Request Management**
- View all submitted leave requests with status indicators
- Edit pending requests before approval
- Cancel pending requests
- Track request status (Pending / Approved / Rejected / Cancelled)
- View teacher comments/feedback on requests

✅ **Real-time Updates**
- Automatic updates when teacher reviews requests
- Live status changes without page refresh
- Notification system integration (infrastructure ready)

✅ **Teacher Assignment Display**
- Shows assigned teacher information
- Displays class assignment
- Warning if no teacher is assigned

✅ **Statistics Dashboard**
- Total requests count
- Pending requests count
- Approved requests count
- Rejected requests count

### 2. Teacher Dashboard Features
✅ **Student Leave Requests View**
- Teachers only see requests from their assigned students/classes
- Filtered by teacher ID for security
- Real-time updates when students submit requests

✅ **Request Review Actions**
- Review request details (student info, dates, reason)
- Approve leave with optional comment
- Reject leave with mandatory feedback
- Add teacher notes/feedback

✅ **Automatic Attendance Updates**
- When approved: System automatically updates attendance records
- Marks all dates in leave period as "Excused Leave"
- Skips weekends automatically
- Links leave reason to attendance notes

✅ **Request History**
- View all past reviewed requests
- Filter by status
- See review timestamps and comments

✅ **Statistics Dashboard**
- Pending requests count
- Approved leaves count
- Total history count

### 3. System Rules & Security

✅ **Role-Based Access Control**
- Students can only submit leave to their assigned teacher
- Teachers can only manage leave for their own classes
- Admin has full oversight (infrastructure ready)

✅ **Data Validation**
- End date must be after start date
- Leave type is required
- Detailed reason is mandatory
- Teacher assignment validation

✅ **Status Management**
- Pending: Initial state after submission
- Approved: Teacher approved, attendance updated
- Rejected: Teacher rejected with feedback
- Cancelled: Student cancelled before review

✅ **Edit/Cancel Rules**
- Students can only edit/cancel pending requests
- Cannot modify after teacher review
- Clear error messages for invalid operations

### 4. Attendance Integration

✅ **Automatic Attendance Updates**
When a leave request is approved:
1. System calculates all dates in the leave period
2. Skips weekends (Saturday/Sunday)
3. Creates/updates attendance records for each date
4. Sets status to "excused"
5. Adds leave details to attendance notes
6. Links to original leave request

✅ **Attendance Record Details**
- Status: "excused"
- Notes: "Approved leave: [Type] - [Reason]"
- Marked by: Teacher who approved
- Date: Each day in leave period

## Technical Implementation

### Database Structure

#### LeaveRequests Collection
```typescript
{
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
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt: string; // ISO timestamp
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  cancelledAt?: string;
  cancelReason?: string;
}
```

#### Notifications Collection (Infrastructure)
```typescript
{
  recipientId: string;
  recipientRole: 'student' | 'teacher' | 'admin';
  type: 'leave_request_submitted' | 'leave_request_approved' | 'leave_request_rejected' | 'leave_request_cancelled';
  title: string;
  message: string;
  leaveRequestId: string;
  studentId?: string;
  teacherId?: string;
  read: boolean;
  createdAt: string;
}
```

### Key Functions

#### Student Functions
- `submitLeaveRequest()` - Submit new leave request
- `updateLeaveRequest()` - Edit pending request
- `cancelLeaveRequest()` - Cancel pending request
- `subscribeToStudentLeaveRequests()` - Real-time updates
- `getStudentAssignedTeacher()` - Get teacher assignment
- `getStudentLeaveStatistics()` - Get leave stats

#### Teacher Functions
- `subscribeToTeacherLeaveRequests()` - Real-time updates for teacher's students
- `updateLeaveRequestStatus()` - Approve/reject with comments
- `updateAttendanceForApprovedLeave()` - Auto-update attendance

#### Admin Functions (Ready for implementation)
- `subscribeToAllLeaveRequests()` - View all requests
- `deleteLeaveRequest()` - Delete any request

### Security Rules (Firestore)

```javascript
// Recommended Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Leave Requests
    match /leaveRequests/{requestId} {
      // Students can read their own requests
      allow read: if request.auth != null && 
                     resource.data.studentId == request.auth.uid;
      
      // Students can create requests for themselves
      allow create: if request.auth != null && 
                       request.resource.data.studentId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      // Students can update their own pending requests
      allow update: if request.auth != null && 
                       resource.data.studentId == request.auth.uid &&
                       resource.data.status == 'pending' &&
                       (request.resource.data.status == 'pending' || 
                        request.resource.data.status == 'cancelled');
      
      // Teachers can read requests assigned to them
      allow read: if request.auth != null && 
                     resource.data.teacherId == request.auth.uid;
      
      // Teachers can update status of their students' requests
      allow update: if request.auth != null && 
                       resource.data.teacherId == request.auth.uid &&
                       resource.data.status == 'pending' &&
                       (request.resource.data.status == 'approved' || 
                        request.resource.data.status == 'rejected');
      
      // Admins can read/write all
      allow read, write: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications
    match /notifications/{notificationId} {
      // Users can read their own notifications
      allow read: if request.auth != null && 
                     resource.data.recipientId == request.auth.uid;
      
      // System can create notifications
      allow create: if request.auth != null;
      
      // Users can update their own notifications (mark as read)
      allow update: if request.auth != null && 
                       resource.data.recipientId == request.auth.uid;
    }
  }
}
```

## User Interface

### Student View
1. **Dashboard Card** - Shows assigned teacher and class
2. **Summary Cards** - Total, Pending, Approved, Rejected counts
3. **Request List** - All requests with status badges
4. **Action Buttons** - Edit/Cancel for pending requests
5. **New Request Dialog** - Form to submit new request
6. **Edit Dialog** - Form to edit pending request
7. **Guidelines Card** - Instructions and best practices

### Teacher View
1. **Summary Cards** - Pending, Approved, Total counts
2. **Active Requests** - Pending requests requiring action
3. **Request Cards** - Student info, dates, reason
4. **Action Buttons** - Approve/Reject with comments
5. **Review Dialog** - Add feedback and confirm action
6. **Request History** - Past reviewed requests

## Navigation

### Student Sidebar
- Dashboard
- Attendance
- **Leave Requests** ← New
- Schedule
- Notifications
- Settings

### Teacher Sidebar
- Dashboard
- Classes
- Attendance
- Students
- Reports
- Schedule
- **Leave Requests** ← Already exists, enhanced
- Settings

## Testing Checklist

### Student Tests
- [ ] Submit leave request with valid data
- [ ] Submit leave request without teacher assignment
- [ ] Edit pending leave request
- [ ] Cancel pending leave request
- [ ] Try to edit approved/rejected request (should fail)
- [ ] View teacher comments on reviewed requests
- [ ] Check real-time updates when teacher reviews

### Teacher Tests
- [ ] View only assigned students' requests
- [ ] Approve leave request with comment
- [ ] Reject leave request with comment
- [ ] Verify attendance auto-update on approval
- [ ] View request history
- [ ] Check real-time updates when student submits

### Integration Tests
- [ ] Verify attendance records created for approved leave
- [ ] Check "excused" status in attendance
- [ ] Verify leave notes in attendance records
- [ ] Test weekend skipping in date range
- [ ] Verify notifications are created (when implemented)

## Future Enhancements

### Phase 2 (Recommended)
1. **File Attachments**
   - Upload medical certificates
   - Store in Firebase Storage
   - Display in request details

2. **Email Notifications**
   - Send email when request submitted
   - Send email when request reviewed
   - Configurable notification preferences

3. **Admin Dashboard**
   - View all leave requests
   - Override teacher decisions
   - Generate leave reports
   - Export leave data

4. **Advanced Features**
   - Leave balance tracking
   - Leave type quotas
   - Bulk approval
   - Leave calendar view
   - SMS notifications

5. **Reports**
   - Leave statistics by class
   - Leave trends analysis
   - Student leave history report
   - Teacher workload report

## Deployment Notes

### Required Firestore Indexes
```
Collection: leaveRequests
- studentId (Ascending) + submittedAt (Descending)
- teacherId (Ascending) + submittedAt (Descending)
- status (Ascending) + submittedAt (Descending)
```

### Environment Variables
No additional environment variables required. Uses existing Firebase configuration.

### Migration Steps
1. Deploy updated code
2. Create Firestore indexes (Firebase will prompt)
3. Test with sample data
4. Train users on new feature
5. Monitor for issues

## Support & Troubleshooting

### Common Issues

**Issue: Student can't submit leave request**
- Check if student is assigned to a class
- Verify teacher assignment in enrollments
- Check Firestore security rules

**Issue: Teacher doesn't see requests**
- Verify teacherId matches in leave requests
- Check if teacher is assigned to classes
- Verify Firestore security rules

**Issue: Attendance not updating on approval**
- Check attendance collection permissions
- Verify date range calculation
- Check console for errors

**Issue: Real-time updates not working**
- Verify Firestore connection
- Check browser console for errors
- Ensure user is authenticated

## Conclusion

The Leave Request Management System is now fully integrated and operational. It provides a secure, user-friendly way for students to request leave and for teachers to manage those requests efficiently. The automatic attendance integration ensures data consistency and reduces manual work.

For questions or issues, please refer to the troubleshooting section or contact the development team.
