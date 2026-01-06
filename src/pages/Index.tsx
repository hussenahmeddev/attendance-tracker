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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">EduTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Enterprise-Grade Attendance System
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Smart Attendance{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tracking
              </span>{" "}
              for Modern Education
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Streamline attendance management with role-based dashboards, real-time analytics,
              and automated notifications. Built for schools, colleges, and universities.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Manage Attendance
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete solution designed for educational institutions of all sizes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Tailored Dashboards for Every Role
            </h2>
            <p className="text-lg text-muted-foreground">
              Each user gets a personalized experience designed for their specific needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {roles.map((role, index) => (
              <Link
                key={role.title}
                to={role.href}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 transition-opacity group-hover:opacity-5`} />
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${role.gradient} p-3`}>
                  {role.title === "Administrator" && <ShieldCheck className="h-6 w-6 text-white" />}
                  {role.title === "Teacher" && <Users className="h-6 w-6 text-white" />}
                  {role.title === "Student" && <GraduationCap className="h-6 w-6 text-white" />}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{role.title}</h3>
                <p className="mb-4 text-muted-foreground">{role.description}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Explore Dashboard
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Attendance Management?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of educational institutions already using EduTrack.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">EduTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 EduTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
