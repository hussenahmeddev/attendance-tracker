import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { Calendar, CheckCircle2, XCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchStudentAttendance,
  calculateStudentAttendanceSummary,
  getAttendanceCalendarData,
  type AttendanceRecord,
  type StudentAttendanceSummary,
  type AttendanceStatus
} from "@/lib/attendanceUtils";
import {
  getAttendanceGrade,
  STATUS_COLORS,
  ATTENDANCE_GRADES,
  ATTENDANCE_THRESHOLDS
} from "@/config/constants";

export default function StudentAttendance() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, AttendanceStatus>>({});
  const [currentDate] = useState(new Date());

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!userData?.userId) return;

      try {
        // Fetch recent attendance records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const records = await fetchStudentAttendance(userData.userId, startDate);
        setAttendanceRecords(records);

        // Calculate attendance summary
        const summary = await calculateStudentAttendanceSummary(userData.userId);
        setAttendanceSummary(summary);

        // Get calendar data for current month
        const calData = await getAttendanceCalendarData(
          userData.userId,
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        setCalendarData(calData);

      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [userData, currentDate]);

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
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

  const getAttendanceGradeInfo = (percentage: number) => {
    return getAttendanceGrade(percentage);
  };

  return (
    <DashboardLayout
      role="student"
      pageTitle="My Attendance"
      pageDescription="View your attendance records and statistics"
    >
      <div className="space-y-6">
        <UserProfile />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading attendance data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Attendance Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceSummary?.attendancePercentage || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Performance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceSummary?.presentCount || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceSummary?.absentCount || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceSummary?.lateCount || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Late</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Attendance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <h3 className="font-semibold">Current Performance</h3>
                        <p className="text-sm text-muted-foreground">
                          {attendanceSummary.presentCount + attendanceSummary.lateCount} out of {attendanceSummary.totalClasses} classes attended
                          {attendanceSummary.lateCount > 0 && <span className="block text-[10px] text-yellow-600 mt-1">* Late arrivals count as 50% for performance score</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{attendanceSummary.attendancePercentage}%</div>
                        <div className={`text-sm px-2 py-1 rounded ${getAttendanceGrade(attendanceSummary.attendancePercentage).bg} ${getAttendanceGrade(attendanceSummary.attendancePercentage).color}`}>
                          {getAttendanceGrade(attendanceSummary.attendancePercentage).grade}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="font-medium">Breakdown</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Present:</span>
                            <span className="font-medium text-green-600">{attendanceSummary.presentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Late:</span>
                            <span className="font-medium text-yellow-600">{attendanceSummary.lateCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Absent:</span>
                            <span className="font-medium text-red-600">{attendanceSummary.absentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Excused:</span>
                            <span className="font-medium text-blue-600">{attendanceSummary.excusedCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Last Attendance</h4>
                        <p className="text-sm text-muted-foreground">
                          {attendanceSummary.lastAttendance
                            ? new Date(attendanceSummary.lastAttendance).toLocaleDateString()
                            : 'No records yet'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No attendance records yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your attendance will be tracked once classes begin and teachers start taking attendance.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Calendar */}
            <AttendanceCalendar
              attendanceData={calendarData}
              className="w-full"
            />

            {/* Recent Attendance Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Attendance Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">
                        Records will appear here once your teachers start taking attendance for classes.
                      </p>
                    </div>
                  ) : (
                    attendanceRecords.slice(0, 10).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="font-medium">{record.className}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()} • Teacher: {record.teacherName}
                            </p>
                            {record.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Note: {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(record.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(record.markedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Excellent Attendance ({ATTENDANCE_THRESHOLDS.EXCELLENT}%+)</p>
                      <p className="text-muted-foreground">{ATTENDANCE_GRADES.EXCELLENT.description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Good Attendance ({ATTENDANCE_THRESHOLDS.GOOD}-{ATTENDANCE_THRESHOLDS.EXCELLENT - 1}%)</p>
                      <p className="text-muted-foreground">{ATTENDANCE_GRADES.GOOD.description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Satisfactory Attendance ({ATTENDANCE_THRESHOLDS.SATISFACTORY}-{ATTENDANCE_THRESHOLDS.GOOD - 1}%)</p>
                      <p className="text-muted-foreground">{ATTENDANCE_GRADES.SATISFACTORY.description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Needs Improvement (Below {ATTENDANCE_THRESHOLDS.SATISFACTORY}%)</p>
                      <p className="text-muted-foreground">{ATTENDANCE_GRADES.NEEDS_IMPROVEMENT.description}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Performance Scoring</p>
                      <p className="text-muted-foreground">
                        Present: 1.0pt | Excused: 1.0pt | Late: 0.5pt | Absent: 0pt
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}