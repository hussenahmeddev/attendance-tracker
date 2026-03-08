# Leave Request System - Quick Setup Guide

## Prerequisites
- Firebase project configured
- Firestore database enabled
- User authentication working
- Students enrolled in classes with assigned teachers

## Setup Steps

### 1. Deploy Firestore Security Rules

Copy the rules from `firestore.rules.example` to your Firebase Console:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace existing rules with the content from `firestore.rules.example`
3. Click "Publish"

### 2. Create Required Firestore Indexes

Firebase will automatically prompt you to create indexes when you first use the queries. Alternatively, create them manually:

**Index 1: Leave Requests by Student**
- Collection: `leaveRequests`
- Fields:
  - `studentId` (Ascending)
  - `submittedAt` (Descending)

**Index 2: Leave Requests by Teacher**
- Collection: `leaveRequests`
- Fields:
  - `teacherId` (Ascending)
  - `submittedAt` (Descending)

**Index 3: Leave Requests by Status**
- Collection: `leaveRequests`
- Fields:
  - `status` (Ascending)
  - `submittedAt` (Descending)

### 3. Verify Student-Teacher Assignments

Ensure students are properly enrolled in classes:

1. Go to Admin Dashboard → Classes
2. Verify each class has a teacher assigned
3. Go to Admin Dashboard → Users
4. Enroll students in their respective classes

The system uses the `enrollments` collection to determine which teacher a student should submit leave requests to.

### 4. Test the System

#### As Student:
1. Login as a student
2. Navigate to "Leave Requests" in sidebar
3. Verify assigned teacher is displayed
4. Click "New Request"
5. Fill in the form and submit
6. Verify request appears in the list with "Pending" status

#### As Teacher:
1. Login as a teacher
2. Navigate to "Leave Requests" in sidebar
3. Verify you see the student's request
4. Click "Approve" or "Reject"
5. Add a comment
6. Submit the review

#### Verify Attendance Integration:
1. After approving a leave request
2. Go to Attendance section
3. Check the dates in the leave period
4. Verify attendance is marked as "Excused"
5. Check the notes contain leave details

## Troubleshooting

### Students Can't Submit Requests

**Problem:** "Unable to submit. Teacher assignment not found."

**Solution:**
1. Verify student is enrolled in a class
2. Check the `enrollments` collection in Firestore
3. Ensure the class has a `teacherId` field
4. Verify the teacher user exists

**Manual Fix:**
```javascript
// In Firestore Console, create enrollment document:
{
  studentId: "STD001",
  classId: "class-id-here",
  enrolledAt: "2024-01-01T00:00:00.000Z"
}

// Ensure class document has:
{
  teacherId: "TCH001",
  teacherName: "Teacher Name",
  name: "Class Name"
}
```

### Teachers Don't See Requests

**Problem:** Teacher dashboard shows no requests

**Solution:**
1. Verify `teacherId` in leave request matches teacher's `userId`
2. Check Firestore security rules are deployed
3. Verify teacher is logged in with correct account

**Debug Query:**
```javascript
// In browser console:
const requests = await getDocs(
  query(
    collection(db, 'leaveRequests'),
    where('teacherId', '==', 'YOUR_TEACHER_ID')
  )
);
console.log(requests.docs.map(d => d.data()));
```

### Attendance Not Updating

**Problem:** Approved leave doesn't update attendance

**Solution:**
1. Check browser console for errors
2. Verify attendance collection permissions
3. Ensure `saveAttendanceRecord` function has proper access

**Manual Verification:**
```javascript
// Check if attendance records were created:
const attendance = await getDocs(
  query(
    collection(db, 'attendance'),
    where('studentId', '==', 'STD001'),
    where('status', '==', 'excused')
  )
);
console.log(attendance.docs.map(d => d.data()));
```

### Real-time Updates Not Working

**Problem:** Changes don't appear without refresh

**Solution:**
1. Check browser console for WebSocket errors
2. Verify Firestore connection is active
3. Check if user is authenticated
4. Try clearing browser cache

## Configuration Options

### Customize Leave Types

Edit `attendance-tracker/src/pages/student/LeaveRequest.tsx`:

```typescript
<SelectContent>
  <SelectItem value="Sick">Sick Leave</SelectItem>
  <SelectItem value="Personal">Personal Leave</SelectItem>
  <SelectItem value="Emergency">Emergency Leave</SelectItem>
  <SelectItem value="Other">Other</SelectItem>
  // Add more types here
</SelectContent>
```

### Customize Weekend Skipping

Edit `attendance-tracker/src/lib/leaveUtils.ts` in `updateAttendanceForApprovedLeave`:

```typescript
// Skip weekends (Saturday/Sunday)
const dayOfWeek = date.getDay();
if (dayOfWeek === 0 || dayOfWeek === 6) continue;

// To include weekends, comment out the above lines
```

### Customize Notification Messages

Edit `attendance-tracker/src/lib/leaveUtils.ts` in `createLeaveNotification`:

```typescript
await createLeaveNotification({
  // ... other fields
  title: 'Your Custom Title',
  message: 'Your custom message'
});
```

## Performance Optimization

### Enable Offline Persistence

Already enabled in `firebase.ts`. Ensures app works offline.

### Limit Query Results

For large datasets, add limits to queries:

```typescript
const q = query(
  collection(db, 'leaveRequests'),
  where('teacherId', '==', teacherId),
  orderBy('submittedAt', 'desc'),
  limit(50) // Add this
);
```

### Cache Teacher Assignments

The system already caches teacher assignments in component state.

## Monitoring

### Check Leave Request Activity

```javascript
// In Firestore Console, run query:
// Collection: leaveRequests
// Order by: submittedAt desc
// Limit: 100
```

### Monitor Attendance Updates

```javascript
// Check attendance records with leave notes:
// Collection: attendance
// Where: status == 'excused'
// Order by: markedAt desc
```

### Track Notification Delivery

```javascript
// Collection: notifications
// Where: type starts with 'leave_request'
// Order by: createdAt desc
```

## Next Steps

1. ✅ Test with real users
2. ✅ Monitor for errors in production
3. ⏳ Implement file attachments (Phase 2)
4. ⏳ Add email notifications (Phase 2)
5. ⏳ Create admin oversight dashboard (Phase 2)
6. ⏳ Generate leave reports (Phase 2)

## Support

For issues or questions:
1. Check this guide first
2. Review `LEAVE_REQUEST_IMPLEMENTATION.md` for detailed documentation
3. Check browser console for errors
4. Review Firestore security rules
5. Contact development team

## Success Criteria

✅ Students can submit leave requests
✅ Teachers receive and can review requests
✅ Approved leaves update attendance automatically
✅ Real-time updates work correctly
✅ Security rules prevent unauthorized access
✅ System is responsive and user-friendly

---

**Last Updated:** March 2026
**Version:** 1.0.0
