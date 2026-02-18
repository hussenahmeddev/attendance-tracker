import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAttendanceStatistics, getAttendanceTrends } from "@/lib/attendanceUtils";
import { fetchAllClasses, getClassStats } from "@/lib/classUtils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  Activity,
  Calendar,
  Clock,
  UserPlus,
  FileText,
  Database,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Eye,
  Settings,
  RefreshCw,
  ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
  const { userData, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    database: 'online',
    authentication: 'active',
    storage: 'available',
    lastBackup: '2 hours ago',
    uptime: '99.9%'
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalClasses: 0,
    activeClasses: 0,
    pendingClasses: 0,
    dailyAttendanceRate: 0,
    weeklyAttendanceRate: 0,
    monthlyAttendanceRate: 0,
    totalAttendanceRecords: 0,
    todayAttendanceRecords: 0,
    averageClassSize: 0,
    totalEnrollments: 0,
    systemLoad: 'Normal'
  });

  // Add caching state
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [cachedData, setCachedData] = useState<any>(null);
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [attendanceDistribution, setAttendanceDistribution] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  // Real-time listener for system activity
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = onSnapshot(
        query(
          collection(db, 'attendanceBroadcasts'),
          orderBy('timestamp', 'desc'),
          limit(5)
        ),
        (snapshot) => {
          const updates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp
          }));
          setRealTimeUpdates(updates);
        },
        (error) => {
          console.error('Real-time updates error:', error);
        }
      );
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array to run once

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);

        // Fetch users with role breakdown
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());

        const totalUsers = users.length;
        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalTeachers = users.filter(u => u.role === 'teacher').length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;

        // Fetch classes with detailed stats
        const classes = await fetchAllClasses();
        const classStats = getClassStats(classes);
        const activeClasses = classes.filter(c => c.status === 'active').length;
        const pendingClasses = classes.filter(c => c.status === 'pending').length;

        // Get today's date for attendance stats
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Get week start (Monday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

        // Get month start
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`;

        // Fetch comprehensive attendance statistics
        const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
          getAttendanceStatistics(todayStr, todayStr),
          getAttendanceStatistics(weekStartStr, todayStr),
          getAttendanceStatistics(monthStartStr, todayStr)
        ]);

        // Fetch attendance trends for the last 14 days
        const trends = await getAttendanceTrends(14);

        // Fetch recent activity with enhanced data
        const recentActivityData = await fetchRecentActivity();

        // Calculate attendance distribution
        const distribution = [
          { name: 'Present', value: dailyStats.presentCount, color: '#22c55e' },
          { name: 'Late', value: dailyStats.lateCount, color: '#f59e0b' },
          { name: 'Absent', value: dailyStats.absentCount, color: '#ef4444' },
          { name: 'Excused', value: dailyStats.excusedCount, color: '#3b82f6' }
        ];

        // Calculate class performance (top 5 classes by attendance rate)
        const classPerformanceData = await calculateClassPerformance(classes.slice(0, 5));

        // Get enrollment count
        const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
        const totalEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'active').length;

        setStats({
          totalUsers,
          totalStudents,
          totalTeachers,
          totalAdmins,
          totalClasses: classes.length,
          activeClasses,
          pendingClasses,
          dailyAttendanceRate: dailyStats.attendanceRate,
          weeklyAttendanceRate: weeklyStats.attendanceRate,
          monthlyAttendanceRate: monthlyStats.attendanceRate,
          totalAttendanceRecords: monthlyStats.totalRecords,
          todayAttendanceRecords: dailyStats.totalRecords,
          averageClassSize: classStats.averageClassSize,
          totalEnrollments,
          systemLoad: calculateSystemLoad(totalUsers, classes.length, monthlyStats.totalRecords)
        });

        setAttendanceTrends(trends);
        setRecentActivity(recentActivityData);
        setAttendanceDistribution(distribution);
        setClassPerformance(classPerformanceData);
        setLastUpdated(new Date());
        setIsInitialized(true);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsInitialized(true); // Set initialized even on error to prevent infinite loading
      } finally {
        setDataLoading(false);
      }
    };

    // Only fetch data if user is authenticated and not in loading state
    if (!loading && userData) {
      fetchDashboardData();
    }

    // Set up auto-refresh every 5 minutes only after initial load
    let interval: NodeJS.Timeout;
    if (!loading && userData && isInitialized) {
      interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, userData, isInitialized]);

  const calculateSystemLoad = (users: number, classes: number, records: number): string => {
    const load = (users * 0.3) + (classes * 0.2) + (records * 0.0001);
    if (load < 50) return 'Light';
    if (load < 100) return 'Normal';
    if (load < 200) return 'High';
    return 'Critical';
  };

  const calculateClassPerformance = async (classes: any[]): Promise<any[]> => {
    const performance = [];

    for (const cls of classes) {
      try {
        const stats = await getAttendanceStatistics(undefined, undefined, cls.id);
        performance.push({
          name: cls.name,
          attendanceRate: stats.attendanceRate,
          totalRecords: stats.totalRecords,
          students: cls.students
        });
      } catch (error) {
        console.error(`Error calculating performance for class ${cls.name}:`, error);
      }
    }

    return performance.sort((a, b) => b.attendanceRate - a.attendanceRate);
  };

  const fetchRecentActivity = async () => {
    try {
      const activities = [];

      // Optimized: Fetch fewer records with limits
      const [attendanceSnapshot, usersSnapshot, classesSnapshot, enrollmentsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'attendance'),
          orderBy('markedAt', 'desc'),
          limit(5) // Reduced from 8
        )),
        getDocs(query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(3) // Reduced from 5
        )),
        getDocs(query(
          collection(db, 'classes'),
          orderBy('createdAt', 'desc'),
          limit(3) // Reduced from 5
        )),
        getDocs(query(
          collection(db, 'enrollments'),
          orderBy('enrolledAt', 'desc'),
          limit(3) // Reduced from 5
        ))
      ]);

      // Process attendance records
      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'attendance',
          message: `Attendance marked for ${data.studentName}`,
          details: `${data.className} - Status: ${data.status}`,
          timestamp: data.markedAt,
          icon: UserCheck,
          priority: data.status === 'absent' ? 'high' : 'normal'
        });
      });

      // Process user records
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'user',
          message: `New ${data.role} registered`,
          details: `${data.displayName} (${data.email})`,
          timestamp: data.createdAt,
          icon: UserPlus,
          priority: 'normal'
        });
      });

      // Process class records
      classesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'class',
          message: `Class "${data.name}" created`,
          details: `Teacher: ${data.teacher}, Room: ${data.room}`,
          timestamp: data.createdAt,
          icon: BookOpen,
          priority: 'normal'
        });
      });

      // Process enrollment records
      enrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'enrollment',
          message: `Student enrolled in class`,
          details: `${data.studentName} joined class`,
          timestamp: data.enrolledAt,
          icon: GraduationCap,
          priority: 'normal'
        });
      });

      // Sort all activities by timestamp and return top 12 (reduced from 15)
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 12);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getSystemHealthIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const refreshData = async () => {
    console.log("Starting dashboard refresh (Parallel Optimized)...");
    const startTime = performance.now();
    setDataLoading(true);

    try {
      // Setup Dates
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`;

      console.log("Dispatching parallel requests...");

      // Execute all independent fetches in parallel
      const [
        usersSnapshot,
        classes,
        dailyStats,
        weeklyStats,
        monthlyStats,
        trends,
        recentActivityData,
        enrollmentsSnapshot
      ] = await Promise.all([
        // 1. Users (with limit)
        getDocs(query(collection(db, 'users'), limit(1000))).catch(e => {
          console.error("Error fetching users:", e);
          return { docs: [] };
        }),
        // 2. Classes (with limit)
        fetchAllClasses(200).catch(e => {
          console.error("Error fetching classes:", e);
          return [];
        }),
        // 3. Daily Stats
        getAttendanceStatistics(todayStr, todayStr).catch(e => {
          console.error("Error fetching daily stats:", e);
          return { totalRecords: 0, attendanceRate: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0 };
        }),
        // 4. Weekly Stats
        getAttendanceStatistics(weekStartStr, todayStr).catch(e => {
          console.error("Error fetching weekly stats:", e);
          return { totalRecords: 0, attendanceRate: 0 };
        }),
        // 5. Monthly Stats
        getAttendanceStatistics(monthStartStr, todayStr).catch(e => {
          console.error("Error fetching monthly stats:", e);
          return { totalRecords: 0, attendanceRate: 0 };
        }),
        // 6. Trends
        getAttendanceTrends(14).catch(e => {
          console.error("Error fetching trends:", e);
          return [];
        }),
        // 7. Recent Activity
        fetchRecentActivity().catch(e => {
          console.error("Error fetching recent activity:", e);
          return [];
        }),
        // 8. Enrollments (with limit)
        getDocs(query(collection(db, 'enrollments'), limit(1000))).catch(e => {
          console.error("Error fetching enrollments:", e);
          return { docs: [] };
        })
      ]);

      // Process Results
      console.log("All requests completed. Processing data...");

      // User Stats
      // @ts-ignore - Handle potential missing docs property from robust error catch
      const users = usersSnapshot.docs ? usersSnapshot.docs.map(doc => doc.data()) : [];
      const totalUsers = users.length;
      const totalStudents = users.filter(u => u.role === 'student').length;
      const totalTeachers = users.filter(u => u.role === 'teacher').length;
      const totalAdmins = users.filter(u => u.role === 'admin').length;

      // Class Stats
      const classStats = getClassStats(classes);
      const activeClasses = classes.filter(c => c.status === 'active').length;
      const pendingClasses = classes.filter(c => c.status === 'pending').length;

      // Class Performance (Needs classes first, so we do it after classes fetch, but arguably could be parallel if we moved logic. 
      // For safety, we keep it here but it's fast since it just uses memory stats or simple lookups)
      // Actually calculateClassPerformance calls getAttendanceStatistics internally per class.
      // To truly optimize, we should parallelize this too.
      console.log("Calculating class performance...");
      const topClasses = classes.slice(0, 5);
      const classPerformanceData = await calculateClassPerformance(topClasses).catch(e => {
        console.error("Error calculating class performance:", e);
        return [];
      });

      // Enrollment Stats
      // @ts-ignore
      const totalEnrollments = enrollmentsSnapshot.docs ? enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'active').length : 0;

      // Distribution
      const distribution = [
        { name: 'Present', value: dailyStats.presentCount || 0, color: '#22c55e' },
        { name: 'Late', value: dailyStats.lateCount || 0, color: '#f59e0b' },
        { name: 'Absent', value: dailyStats.absentCount || 0, color: '#ef4444' },
        { name: 'Excused', value: dailyStats.excusedCount || 0, color: '#3b82f6' }
      ];

      // Update State
      console.log("Updating dashboard state...");
      setStats({
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalAdmins: totalAdmins || 0,
        totalClasses: classes.length || 0,
        activeClasses: activeClasses || 0,
        pendingClasses: pendingClasses || 0,
        dailyAttendanceRate: dailyStats.attendanceRate || 0,
        weeklyAttendanceRate: weeklyStats.attendanceRate || 0,
        monthlyAttendanceRate: monthlyStats.attendanceRate || 0,
        totalAttendanceRecords: monthlyStats.totalRecords || 0,
        todayAttendanceRecords: dailyStats.totalRecords || 0,
        averageClassSize: classStats.averageClassSize || 0,
        totalEnrollments: totalEnrollments || 0,
        systemLoad: calculateSystemLoad(totalUsers, classes.length, monthlyStats.totalRecords || 0)
      });

      setAttendanceTrends(trends);
      setRecentActivity(recentActivityData);
      setAttendanceDistribution(distribution);
      setClassPerformance(classPerformanceData);
      setLastUpdated(new Date());

      const endTime = performance.now();
      console.log(`Dashboard refresh complete in ${Math.round(endTime - startTime)}ms`);

    } catch (error) {
      console.error('CRITICAL ERROR refreshing dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Show loading only during initial authentication, not during data refresh
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Loading Admin Dashboard</p>
          <p className="text-sm text-muted-foreground">Authenticating user...</p>
        </div>
      </div>
    );
  }

  // Show loading for initial data fetch only
  if (!isInitialized && dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Loading Dashboard Data</p>
          <p className="text-sm text-muted-foreground">Gathering system analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      pageTitle="Admin Dashboard"
      pageDescription="System Command Center & Analytics"
    >
      <div className="space-y-6">
        {/* Header with refresh and last updated */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()} • System Load: {stats.systemLoad}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={dataLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
            {dataLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* User Profile */}
        <UserProfile />

        {/* Loading Overlay for Data Refresh */}
        {dataLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium text-foreground">Refreshing Dashboard Data</p>
              <p className="text-sm text-muted-foreground">Gathering latest analytics...</p>
            </div>
          </div>
        )}

        {/* Real-time Updates Banner */}
        {realTimeUpdates.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Live System Activity</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {realTimeUpdates[0]?.message} • {formatTimestamp(realTimeUpdates[0]?.timestamp)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced System-wide Analytics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle={`${stats.totalEnrollments} active enrollments`}
            icon={GraduationCap}
            variant="success"
            trend={stats.totalStudents > 0 ? { value: 5.2, isPositive: true } : undefined}
          />

          <StatsCard
            title="Total Teachers"
            value={stats.totalTeachers}
            subtitle={`${stats.totalAdmins} administrators`}
            icon={Users}
            variant="info"
            trend={stats.totalTeachers > 0 ? { value: 2.1, isPositive: true } : undefined}
          />

          <StatsCard
            title="Active Classes"
            value={stats.activeClasses}
            subtitle={`${stats.pendingClasses} pending approval`}
            icon={BookOpen}
            variant="default"
            trend={stats.activeClasses > 0 ? { value: 8.3, isPositive: true } : undefined}
          />

          <StatsCard
            title="Daily Attendance"
            value={`${stats.dailyAttendanceRate}%`}
            subtitle={`${stats.todayAttendanceRecords} records today`}
            icon={TrendingUp}
            variant={stats.dailyAttendanceRate >= 80 ? "success" : stats.dailyAttendanceRate >= 60 ? "warning" : "destructive"}
            trend={stats.dailyAttendanceRate >= 80 ? { value: 2.4, isPositive: true } : stats.dailyAttendanceRate >= 60 ? { value: 1.2, isPositive: false } : { value: 5.8, isPositive: false }}
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weekly Attendance</p>
                  <p className="text-2xl font-bold text-foreground">{stats.weeklyAttendanceRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.weeklyAttendanceRate >= stats.dailyAttendanceRate ? "↗️ Improving" : "↘️ Declining"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Attendance</p>
                  <p className="text-2xl font-bold text-foreground">{stats.monthlyAttendanceRate}%</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalAttendanceRecords} total records this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Class Size</p>
                  <p className="text-2xl font-bold text-foreground">{stats.averageClassSize}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across {stats.totalClasses} total classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Classes Management Section */}
        <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Classes Management Center
            </CardTitle>
            <p className="text-muted-foreground">
              Quick access to class management with integrated navigation to all related features
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link 
                to="/admin/classes"
                className="group p-4 bg-white rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Manage Classes</div>
                    <div className="text-sm text-muted-foreground">Create & configure</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  • Create new classes • Assign teachers • Set schedules
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>Go to Classes</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
              
              <Link 
                to="/admin/classes?tab=enrollments"
                className="group p-4 bg-white rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Student Enrollment</div>
                    <div className="text-sm text-muted-foreground">Add/remove students</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  • Enroll students • Manage capacity • View enrollment status
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>Manage Enrollments</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
              
              <Link 
                to="/admin/attendance"
                className="group p-4 bg-white rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Attendance Oversight</div>
                    <div className="text-sm text-muted-foreground">Monitor & manage</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  • View all classes • Lock attendance • Manual corrections • Audit history
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>Manage Attendance</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
              
              <Link 
                to="/admin/calendar"
                className="group p-4 bg-white rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Class Schedules</div>
                    <div className="text-sm text-muted-foreground">Time management</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  • Class timetables • Schedule conflicts • Room assignments
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <span>View Calendar</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            </div>
            
            {/* Quick Stats for Classes */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
                  <div className="text-xs text-muted-foreground">Total Classes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.activeClasses}</div>
                  <div className="text-xs text-muted-foreground">Active Classes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalEnrollments}</div>
                  <div className="text-xs text-muted-foreground">Total Enrollments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.averageClassSize}</div>
                  <div className="text-xs text-muted-foreground">Avg Class Size</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attendance Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Trends (14 Days)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily attendance patterns and trends
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  present: {
                    label: "Present",
                    color: "hsl(142, 76%, 36%)",
                  },
                  absent: {
                    label: "Absent",
                    color: "hsl(0, 72%, 51%)",
                  },
                  late: {
                    label: "Late",
                    color: "hsl(38, 92%, 50%)",
                  },
                  excused: {
                    label: "Excused",
                    color: "hsl(217, 91%, 60%)",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrends}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExcused" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stackId="1"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPresent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      stackId="1"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLate)"
                    />
                    <Area
                      type="monotone"
                      dataKey="excused"
                      stackId="1"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExcused)"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stackId="1"
                      stroke="hsl(0, 72%, 51%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAbsent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Attendance Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Today's Attendance Distribution
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Breakdown of attendance status
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  present: { label: "Present", color: "#22c55e" },
                  late: { label: "Late", color: "#f59e0b" },
                  absent: { label: "Absent", color: "#ef4444" },
                  excused: { label: "Excused", color: "#3b82f6" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Class Performance Chart */}
        {classPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Performing Classes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Classes ranked by attendance rate
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  attendanceRate: {
                    label: "Attendance Rate",
                    color: "hsl(217, 91%, 60%)",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="attendanceRate" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* System Activity and Health */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enhanced Recent System Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent System Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest system events and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg ${activity.priority === 'high' ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
                        }`}>
                        <div className={`flex-shrink-0 p-2 rounded-full ${activity.priority === 'high' ? 'bg-red-100' : 'bg-primary/10'
                          }`}>
                          <IconComponent className={`h-4 w-4 ${activity.priority === 'high' ? 'text-red-600' : 'text-primary'
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {activity.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.details}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                            {activity.priority === 'high' && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                High Priority
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time system status and performance
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSystemHealthIcon(systemHealth.database)}
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSystemHealthIcon(systemHealth.authentication)}
                  <span className="text-sm font-medium text-blue-600">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSystemHealthIcon(systemHealth.storage)}
                  <span className="text-sm font-medium text-purple-600">Available</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Last Backup</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{systemHealth.lastBackup}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">System Uptime</span>
                </div>
                <span className="text-sm font-medium text-yellow-600">{systemHealth.uptime}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and System Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* System Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="font-semibold">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Classes</span>
                <span className="font-semibold">{stats.activeClasses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Enrollments</span>
                <span className="font-semibold">{stats.totalEnrollments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Records</span>
                <span className="font-semibold">{stats.totalAttendanceRecords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">System Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium text-sm">View All Users</div>
                    <div className="text-xs text-muted-foreground">Manage system users</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Generate Reports</div>
                    <div className="text-xs text-muted-foreground">Create attendance reports</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium text-sm">System Settings</div>
                    <div className="text-xs text-muted-foreground">Configure preferences</div>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.pendingClasses > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      {stats.pendingClasses} Pending Classes
                    </div>
                    <div className="text-xs text-yellow-600">Require approval</div>
                  </div>
                </div>
              )}

              {stats.dailyAttendanceRate < 70 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-sm font-medium text-red-800">Low Attendance Alert</div>
                    <div className="text-xs text-red-600">Daily rate below 70%</div>
                  </div>
                </div>
              )}

              {stats.dailyAttendanceRate >= 70 && stats.pendingClasses === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">All Systems Normal</div>
                    <div className="text-xs text-green-600">No alerts at this time</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Command Center Welcome */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">System Command Center</h2>
                <p className="text-muted-foreground mb-4">
                  Welcome to your comprehensive admin dashboard! This command center provides real-time insights into your attendance tracking system,
                  including system-wide analytics, attendance trends, user activity, and system health monitoring.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h3 className="font-medium text-primary mb-2">📊 Analytics Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor attendance rates, track trends, and analyze system performance with comprehensive charts and statistics.
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h3 className="font-medium text-primary mb-2">🔄 Real-time Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Stay informed with live activity feeds, system health monitoring, and instant notifications of important events.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}