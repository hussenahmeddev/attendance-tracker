import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AttendanceChart } from "@/components/attendance/AttendanceChart";
import { useReportGenerator } from "@/hooks/useReportGenerator";
import { 
  ClipboardCheck, 
  Users, 
  TrendingDown, 
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Edit3,
  History,
  Shield,
  Eye,
  Save,
  RotateCcw,
  UserCheck,
  FileText,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchAllClasses } from "@/lib/classUtils";
import { 
  fetchAllAttendance,
  getAttendanceStatistics,
  calculateStudentAttendanceSummary,
  getAttendanceTrends,
  updateAttendance,
  checkAttendanceSessionLocked,
  type AttendanceRecord,
  type StudentAttendanceSummary
} from "@/lib/attendanceUtils";
import { isLowAttendance, STATUS_COLORS } from "@/config/constants";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  teacherId: string;
}

interface AttendanceAuditLog {
  id: string;
  attendanceId: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  date: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedByRole: string;
  reason: string;
  timestamp: string;
  isAdminOverride: boolean;
}

interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  date: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  status: 'active' | 'completed' | 'locked';
}

export default function AdminAttendance() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<StudentAttendanceSummary[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AttendanceAuditLog[]>([]);

  // Enhanced filtering states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Manual correction states
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editReason, setEditReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Locking states
  const [lockingSession, setLockingSession] = useState<string | null>(null);
  const [unlockingSession, setUnlockingSession] = useState<string | null>(null);

  // Audit history states
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedRecordAudit, setSelectedRecordAudit] = useState<AttendanceRecord | null>(null);
  const [recordAuditHistory, setRecordAuditHistory] = useState<AttendanceAuditLog[]>([]);

  // Report generation states
  const { generateReport, isGenerating, error: reportError } = useReportGenerator();
  const [reportTimePeriod, setReportTimePeriod] = useState("month");
  const [reportClass, setReportClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  // Fetch users, classes, and attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || 'N/A',
            displayName: data.displayName || 'Unknown',
            email: data.email || 'No email',
            role: data.role || 'student',
            status: data.status || 'active',
            createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'
          } as User;
        });
        setUsers(usersData);

        // Fetch classes
        const classesData = await fetchAllClasses();
        setClasses(classesData.filter(c => c.status === 'active'));

        // Fetch attendance data
        await fetchAttendanceData();
        
        // Fetch attendance sessions
        await fetchAttendanceSessions();
        
        // Fetch audit logs
        await fetchAuditLogs();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAttendanceSessions = async () => {
    try {
      const sessionsCollection = collection(db, 'attendanceSessions');
      const q = query(sessionsCollection, orderBy('date', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceSession));
      
      setAttendanceSessions(sessions);
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const auditCollection = collection(db, 'attendanceAuditLogs');
      const q = query(auditCollection, orderBy('timestamp', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceAuditLog));
      
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const lockAttendanceSession = async (sessionId: string, classId: string, date: string) => {
    try {
      setLockingSession(sessionId);
      
      // Update session to locked status
      const sessionRef = doc(db, 'attendanceSessions', sessionId);
      await updateDoc(sessionRef, {
        isLocked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: 'admin', // In real app, use current user
        status: 'locked'
      });

      // Update local state
      setAttendanceSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, isLocked: true, status: 'locked' as const }
          : session
      ));

      toast.success('Attendance session locked successfully');
    } catch (error) {
      console.error('Error locking attendance session:', error);
      toast.error('Failed to lock attendance session');
    } finally {
      setLockingSession(null);
    }
  };

  const unlockAttendanceSession = async (sessionId: string) => {
    try {
      setUnlockingSession(sessionId);
      
      const sessionRef = doc(db, 'attendanceSessions', sessionId);
      await updateDoc(sessionRef, {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
        status: 'active'
      });

      setAttendanceSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, isLocked: false, status: 'active' as const }
          : session
      ));

      toast.success('Attendance session unlocked successfully');
    } catch (error) {
      console.error('Error unlocking attendance session:', error);
      toast.error('Failed to unlock attendance session');
    } finally {
      setUnlockingSession(null);
    }
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditReason("");
    setEditDialogOpen(true);
  };

  const handleSaveAttendanceEdit = async () => {
    if (!editingRecord || !editReason.trim()) {
      toast.error('Please provide a reason for the change');
      return;
    }

    try {
      setIsUpdating(true);

      // Update the attendance record
      await updateAttendance(editingRecord.id, editStatus as any, editingRecord.notes);

      // Create audit log
      const auditLog = {
        attendanceId: editingRecord.id,
        classId: editingRecord.classId,
        className: editingRecord.className,
        studentId: editingRecord.studentId,
        studentName: editingRecord.studentName,
        date: editingRecord.date,
        oldStatus: editingRecord.status,
        newStatus: editStatus,
        changedBy: 'admin', // In real app, use current user
        changedByRole: 'admin',
        reason: editReason,
        timestamp: new Date().toISOString(),
        isAdminOverride: true
      };

      await addDoc(collection(db, 'attendanceAuditLogs'), auditLog);

      // Update local state
      setAttendanceRecords(prev => prev.map(record => 
        record.id === editingRecord.id 
          ? { ...record, status: editStatus as any }
          : record
      ));

      // Refresh audit logs
      await fetchAuditLogs();

      setEditDialogOpen(false);
      toast.success('Attendance record updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance record');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewAuditHistory = async (record: AttendanceRecord) => {
    setSelectedRecordAudit(record);
    
    // Fetch audit history for this specific record
    try {
      const auditCollection = collection(db, 'attendanceAuditLogs');
      const q = query(
        auditCollection, 
        where('attendanceId', '==', record.id),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceAuditLog));
      
      setRecordAuditHistory(history);
      setAuditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching audit history:', error);
      toast.error('Failed to load audit history');
    }
  };

  const fetchAttendanceData = async () => {
    try {
      // Get date range based on filter
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const today = new Date();
      if (dateFilter === 'today') {
        startDate = endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }
      // For 'all' option, leave startDate and endDate undefined to fetch all records

      // Fetch attendance records
      const records = await fetchAllAttendance(startDate, endDate);
      setAttendanceRecords(records);

      // Get attendance statistics
      const stats = await getAttendanceStatistics(startDate, endDate);
      setAttendanceStats(stats);

      // Get attendance trends for chart
      const trends = await getAttendanceTrends(7);
      setAttendanceTrends(trends);

      // Find students with low attendance (always use all-time data for this)
      const students = users.filter(u => u.role === 'student');
      const lowAttendancePromises = students.map(async (student) => {
        const summary = await calculateStudentAttendanceSummary(student.userId);
        return summary;
      });
      
      const summaries = await Promise.all(lowAttendancePromises);
      const lowAttendance = summaries.filter(s => isLowAttendance(s.attendancePercentage) && s.totalClasses > 0);
      setLowAttendanceStudents(lowAttendance);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const handleGenerateSummaryReport = async () => {
    const success = await generateReport({
      type: 'summary',
      format: 'pdf',
      dateRange: reportTimePeriod as any,
      title: `Attendance Summary Report - ${reportTimePeriod}`
    });
    
    if (success) {
      alert('Report generated successfully!');
    } else if (reportError) {
      alert(`Failed to generate report: ${reportError}`);
    }
  };

  const handleGenerateStudentReport = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    const student = students.find(s => s.userId === selectedStudent);
    const title = `Student Attendance Report - ${student?.displayName || selectedStudent}`;
    
    const success = await generateReport({
      type: 'student',
      format: 'pdf',
      dateRange: 'all', // Use custom date range if provided
      targetId: selectedStudent,
      title
    });
    
    if (success) {
      alert('Student report generated successfully!');
    } else if (reportError) {
      alert(`Failed to generate report: ${reportError}`);
    }
  };

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchAttendanceData();
    }
  }, [dateFilter, classFilter, teacherFilter, startDate, endDate]);

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');

  const filteredAttendance = attendanceRecords.filter(record => {
    const matchesClass = classFilter === "all" || record.classId === classFilter;
    const matchesTeacher = teacherFilter === "all" || record.teacherId === teacherFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesSearch = record.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDate && record.date < startDate) matchesDateRange = false;
    if (endDate && record.date > endDate) matchesDateRange = false;
    
    return matchesClass && matchesTeacher && matchesStatus && matchesSearch && matchesDateRange;
  });

  // Calculate statistics from real data
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceStats?.presentCount || 0;
  const absentCount = attendanceStats?.absentCount || 0;
  const lateCount = attendanceStats?.lateCount || 0;
  const attendanceRate = attendanceStats?.attendanceRate || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className={STATUS_COLORS.PRESENT}>Present</Badge>;
      case 'absent':
        return <Badge className={STATUS_COLORS.ABSENT}>Absent</Badge>;
      case 'late':
        return <Badge className={STATUS_COLORS.LATE}>Late</Badge>;
      case 'excused':
        return <Badge className={STATUS_COLORS.EXCUSED}>Excused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Attendance Management"
      pageDescription="Monitor and manage student attendance across all classes"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="oversight" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="oversight">Oversight</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="audit">Audit History</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Attendance Oversight Tab */}
          <TabsContent value="oversight" className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Attendance Oversight Center
                </CardTitle>
                <p className="text-muted-foreground">
                  Comprehensive attendance management with advanced filtering, locking, and audit controls
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">View All Classes</div>
                        <div className="text-sm text-muted-foreground">Monitor attendance</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Filter by date, class, teacher • Real-time status updates
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Lock className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Lock Attendance</div>
                        <div className="text-sm text-muted-foreground">Prevent modifications</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Lock after submission • Admin-only unlock • Audit trail
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Edit3 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Manual Corrections</div>
                        <div className="text-sm text-muted-foreground">Admin overrides</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • Edit any record • Require reason • Full audit logging
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <History className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Audit History</div>
                        <div className="text-sm text-muted-foreground">Complete tracking</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • All changes logged • Who, what, when • Compliance ready
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input
                        type="date"
                        placeholder="End date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Teachers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teachers</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.userId}>
                            {teacher.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search students, classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" onClick={fetchAttendanceData} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtered Results */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records ({filteredAttendance.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredAttendance.slice(0, 50).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.studentId} • {record.className}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Teacher: {record.teacherName} • {record.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAttendance(record)}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAuditHistory(record)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {filteredAttendance.length > 50 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Showing first 50 results. Use filters to narrow down.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading attendance data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                      <p className="text-sm text-muted-foreground">Overall Attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                      <p className="text-sm text-muted-foreground">Present</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                      <p className="text-sm text-muted-foreground">Absent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                      <p className="text-sm text-muted-foreground">Late</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Date Filter */}
                <div className="flex gap-4 items-center">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchAttendanceData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {/* Attendance Trends Chart */}
                {attendanceTrends.length > 0 && (
                  <AttendanceChart 
                    data={attendanceTrends}
                    className="w-full"
                  />
                )}

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Student Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Students</span>
                          <span className="font-semibold">{students.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Students</span>
                          <span className="font-semibold">{students.filter(s => s.status === 'active').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Low Attendance</span>
                          <span className="font-semibold text-red-600">{lowAttendanceStudents.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Class Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Classes</span>
                          <span className="font-semibold">{classes.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Teachers</span>
                          <span className="font-semibold">{teachers.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Attendance Records</span>
                          <span className="font-semibold">{totalRecords}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Attendance Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search students or classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Records List */}
                <div className="space-y-3">
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">Records will appear once attendance is taken</p>
                    </div>
                  ) : (
                    filteredAttendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.studentId} • {record.className}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Teacher: {record.teacherName} • {record.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Attendance Sessions & Locking
                </CardTitle>
                <p className="text-muted-foreground">
                  Manage attendance session locks to prevent unauthorized modifications
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance sessions found</p>
                    </div>
                  ) : (
                    attendanceSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            session.isLocked ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {session.isLocked ? (
                              <Lock className="h-5 w-5 text-red-600" />
                            ) : (
                              <Unlock className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{session.className}</p>
                            <p className="text-sm text-muted-foreground">
                              Date: {session.date} • Teacher: {session.teacherId}
                            </p>
                            {session.isLocked && session.lockedAt && (
                              <p className="text-xs text-red-600">
                                Locked on {new Date(session.lockedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.isLocked ? "destructive" : "default"}>
                            {session.isLocked ? "Locked" : "Unlocked"}
                          </Badge>
                          {session.isLocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unlockAttendanceSession(session.id)}
                              disabled={unlockingSession === session.id}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              {unlockingSession === session.id ? 'Unlocking...' : 'Unlock'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => lockAttendanceSession(session.id, session.classId, session.date)}
                              disabled={lockingSession === session.id}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              {lockingSession === session.id ? 'Locking...' : 'Lock'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit History Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Attendance Audit History
                </CardTitle>
                <p className="text-muted-foreground">
                  Complete log of all attendance modifications and admin overrides
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No audit logs found</p>
                      <p className="text-sm text-muted-foreground">Changes will appear here when attendance is modified</p>
                    </div>
                  ) : (
                    auditLogs.slice(0, 100).map((log) => (
                      <div key={log.id} className={`p-4 border rounded-lg ${
                        log.isAdminOverride ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              log.isAdminOverride ? 'bg-orange-100' : 'bg-blue-100'
                            }`}>
                              {log.isAdminOverride ? (
                                <Shield className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Edit3 className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {log.studentName} - {log.className}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Changed from <Badge variant="outline">{log.oldStatus}</Badge> to <Badge variant="outline">{log.newStatus}</Badge>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                By: {log.changedBy} ({log.changedByRole}) • {new Date(log.timestamp).toLocaleString()}
                              </p>
                              {log.reason && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Reason: {log.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          {log.isAdminOverride && (
                            <Badge variant="destructive" className="text-xs">
                              Admin Override
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Attendance Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search students or classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Records List */}
                <div className="space-y-3">
                  {filteredAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">Records will appear once attendance is taken</p>
                    </div>
                  ) : (
                    filteredAttendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.studentId} • {record.className}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Teacher: {record.teacherName} • {record.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Low Attendance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Students with Low Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowAttendanceStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground">Great! No students with low attendance</p>
                      <p className="text-sm text-muted-foreground">All students are maintaining good attendance rates</p>
                    </div>
                  ) : (
                    lowAttendanceStudents.map((student) => (
                      <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.studentId} • {student.attendancePercentage}% attendance
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.totalClasses} total classes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {student.attendancePercentage}%
                          </Badge>
                          <Button size="sm" variant="outline">
                            Contact Student
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Attendance Summary Report</h3>
                    <div className="space-y-2">
                      <Label>Time Period</Label>
                      <Select value={reportTimePeriod} onValueChange={setReportTimePeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="semester">This Semester</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={reportClass} onValueChange={setReportClass}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleGenerateSummaryReport} disabled={isGenerating}>
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Download Summary Report'}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Student Attendance Report</h3>
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.userId}>
                              {student.displayName} ({student.userId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date" 
                          placeholder="Start date" 
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                        />
                        <Input 
                          type="date" 
                          placeholder="End date" 
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" onClick={handleGenerateStudentReport} disabled={isGenerating}>
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Download Student Report'}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Quick Stats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{attendanceStats?.uniqueStudents || 0}</div>
                      <div className="text-muted-foreground">Active Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{attendanceStats?.uniqueClasses || 0}</div>
                      <div className="text-muted-foreground">Active Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{totalRecords}</div>
                      <div className="text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{attendanceRate}%</div>
                      <div className="text-muted-foreground">Avg Attendance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Manual Correction Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Edit Attendance Record
              </DialogTitle>
            </DialogHeader>
            {editingRecord && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">{editingRecord.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {editingRecord.className} • {editingRecord.date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current Status: {getStatusBadge(editingRecord.status)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Reason for Change *</Label>
                  <Textarea
                    placeholder="Please provide a reason for this change..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Admin Override Warning</p>
                      <p>This change will be logged as an administrative override and will be visible in the audit trail.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAttendanceEdit} 
                disabled={isUpdating || !editReason.trim()}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit History Dialog */}
        <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit History
              </DialogTitle>
            </DialogHeader>
            {selectedRecordAudit && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">{selectedRecordAudit.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecordAudit.className} • {selectedRecordAudit.date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current Status: {getStatusBadge(selectedRecordAudit.status)}
                  </p>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recordAuditHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No changes recorded</p>
                      <p className="text-sm text-muted-foreground">This record has not been modified</p>
                    </div>
                  ) : (
                    recordAuditHistory.map((log, index) => (
                      <div key={log.id} className={`p-3 border rounded-lg ${
                        log.isAdminOverride ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <div className="text-xs text-muted-foreground font-mono">
                              #{recordAuditHistory.length - index}
                            </div>
                            <div>
                              <p className="text-sm">
                                Changed from <Badge variant="outline" className="text-xs">{log.oldStatus}</Badge> to <Badge variant="outline" className="text-xs">{log.newStatus}</Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                By: {log.changedBy} ({log.changedByRole})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                              {log.reason && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Reason: {log.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          {log.isAdminOverride && (
                            <Badge variant="destructive" className="text-xs">
                              Admin Override
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setAuditDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}