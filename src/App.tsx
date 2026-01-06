import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/Users";
import AdminClasses from "./pages/admin/Classes";
import AdminAttendance from "./pages/admin/Attendance";
import AdminReports from "./pages/admin/Reports";
import AdminCalendar from "./pages/admin/Calendar";
import AdminSettings from "./pages/admin/Settings";
import SystemUtils from "./pages/admin/SystemUtils";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherStudents from "./pages/teacher/Students";
import TeacherReports from "./pages/teacher/Reports";
import TeacherSchedule from "./pages/teacher/Schedule";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/Attendance";
import StudentLeaveRequest from "./pages/student/LeaveRequest";
import StudentSchedule from "./pages/student/Schedule";
import StudentNotifications from "./pages/student/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/classes" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminClasses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/attendance" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAttendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/calendar" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCalendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/system-utils" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemUtils />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/classes" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherClasses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/attendance" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherAttendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/students" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherStudents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/reports" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/schedule" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherSchedule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/attendance" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentAttendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/leave" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentLeaveRequest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/schedule" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentSchedule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/notifications" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentNotifications />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
