import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setDeferredPrompt(null));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const userData = await signIn(email, password);

      // Redirect based on user role
      switch (userData.role) {
        case "admin":
          navigate("/admin");
          break;
        case "teacher":
          navigate("/teacher");
          break;
        case "student":
          navigate("/student");
          break;
        default:
          navigate("/admin");
      }
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-950 relative overflow-hidden flex">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EduTrack</span>
            </div>
            <p className="text-blue-100/80">
              Attendance tracking made simple.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-500/20 bg-red-500/10 backdrop-blur-xl">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Glass Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in to your account</h1>
                <p className="text-sm text-blue-100/70">
                  Enter your email below to login to your dashboard
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@institution.edu"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:bg-white/15 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:bg-white/15 focus:border-blue-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                    <span className="text-blue-100/70">Remember me</span>
                  </label>
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 border-0" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {deferredPrompt && (
                <Button
                  variant="outline"
                  className="w-full mt-4 gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={async () => {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') setDeferredPrompt(null);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Install EduTrack App
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDR2LTJ6bTAtOGgtMlYyMmgydi00aC00djhoNHYtek0yMiAyMmgtMnY0aDJ2LTR6bTAgOGgtMnY0aDJ2LTR6bTAtOGgtMnY0aDJ2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-center text-white">
            <div className="mb-6 inline-flex rounded-full bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
              <GraduationCap className="h-16 w-16" />
            </div>
            <h2 className="mb-4 text-3xl font-bold drop-shadow-lg">Welcome to EduTrack</h2>
            <p className="text-lg text-blue-100/90">
              The complete attendance management solution for modern educational institutions.
              Track, analyze, and improve student engagement with powerful tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
