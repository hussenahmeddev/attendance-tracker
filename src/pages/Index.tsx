import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ShieldCheck,
  Users,
  BarChart3,
  Clock,
  Bell,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description: "Secure multi-role system for admins, teachers, and students with granular permissions.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Mark and monitor attendance instantly with live updates across all dashboards.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Comprehensive reports and predictive insights to identify at-risk students early.",
  },
  {
    icon: Bell,
    title: "Automated Alerts",
    description: "Instant notifications for low attendance, absences, and important updates.",
  },
  {
    icon: Users,
    title: "Class Management",
    description: "Effortlessly manage classes, subjects, schedules, and student rosters.",
  },
  {
    icon: GraduationCap,
    title: "Student Portal",
    description: "Students can view attendance, submit leave requests, and track progress.",
  },
];

const roles = [
  {
    title: "Administrator",
    description: "Full system control, user management, analytics, and configuration.",
    href: "/admin",
    gradient: "from-primary to-primary/80",
  },
  {
    title: "Teacher",
    description: "Manage classes, mark attendance, monitor students, and generate reports.",
    href: "/teacher",
    gradient: "from-accent to-accent/80",
  },
  {
    title: "Student",
    description: "View attendance records, submit leave requests, and track performance.",
    href: "/student",
    gradient: "from-info to-info/80",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EduTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-2xl">
              Smart Attendance{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Tracking
              </span>{" "}
              for Modern Education
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-blue-100/90">
              Streamline attendance management with role-based dashboards, real-time analytics,
              and automated notifications. Built for schools, colleges, and universities.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Everything You Need to Manage Attendance
            </h2>
            <p className="text-lg text-blue-100/80">
              A complete solution designed for educational institutions of all sizes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:bg-white/10 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 text-blue-300 transition-all duration-300 group-hover:from-blue-500 group-hover:to-purple-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/50">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-blue-100/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Tailored Dashboards for Every Role
            </h2>
            <p className="text-lg text-blue-100/80">
              Each user gets a personalized experience designed for their specific needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((role, index) => (
              <Link
                key={role.title}
                to={role.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 hover:bg-white/10 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 transition-opacity group-hover:opacity-10`} />
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${role.gradient} p-3 shadow-lg`}>
                  {role.title === "Administrator" && <ShieldCheck className="h-6 w-6 text-white" />}
                  {role.title === "Teacher" && <Users className="h-6 w-6 text-white" />}
                  {role.title === "Student" && <GraduationCap className="h-6 w-6 text-white" />}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{role.title}</h3>
                <p className="mb-4 text-blue-100/70">{role.description}</p>
                <div className="flex items-center text-sm font-medium text-cyan-400">
                  Explore Dashboard
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Ready to Transform Your Attendance Management?
            </h2>
            <p className="mb-8 text-lg text-blue-100/80">
              Join thousands of educational institutions already using EduTrack.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">EduTrack</span>
            </div>
            <p className="text-sm text-blue-100/60">
              © 2026 EduTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
