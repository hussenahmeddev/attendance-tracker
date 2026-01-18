import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  RefreshCw,
  Database,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fixUserCounters, regenerateUserIds } from "@/lib/fixCounters";
import { fixClassEnrollmentCounts } from "@/lib/classUtils";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function SystemUtils() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [fixingEnrollments, setFixingEnrollments] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFixCounters = async () => {
    setFixing(true);
    setMessage(null);
    try {
      const counters = await fixUserCounters();
      setMessage({
        type: 'success',
        text: `Counters fixed successfully! Admin: ${counters.admin}, Teacher: ${counters.teacher}, Student: ${counters.student}`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to fix counters. Check console for details.'
      });
    } finally {
      setFixing(false);
    }
  };

  const handleRegenerateIds = async () => {
    setRegenerating(true);
    setMessage(null);
    try {
      const counters = await regenerateUserIds();
      setMessage({
        type: 'success',
        text: `User IDs regenerated successfully! Please refresh the page to see updated IDs.`
      });
      // Refresh users data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to regenerate user IDs. Check console for details.'
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleFixEnrollments = async () => {
    setFixingEnrollments(true);
    setMessage(null);
    try {
      const fixedCount = await fixClassEnrollmentCounts();
      setMessage({
        type: 'success',
        text: `Class enrollments fixed: ${fixedCount} classes updated.`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to fix enrollments. Check console for details.'
      });
    } finally {
      setFixingEnrollments(false);
    }
  };

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <DashboardLayout
      role="admin"
      pageTitle="System Utilities"
      pageDescription="Fix system counters and regenerate user IDs"
    >
      <div className="space-y-6">
        <UserProfile />

        {message && (
          <Alert className={
            message.type === 'success' ? 'border-green-200 bg-green-50' :
              message.type === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
          }>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
              message.type === 'error' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                <Info className="h-4 w-4 text-blue-600" />}
            <AlertDescription className={
              message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Current System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading system data...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{admins.length}</div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
                  <p className="text-sm text-muted-foreground">Teachers</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{students.length}</div>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Utilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Utilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Fix Counters */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Fix User Counters</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will recalculate and fix the user counters based on actual users in the database.
                      Use this when counters are out of sync (e.g., after manually changing user roles).
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        <strong>What this does:</strong>
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        <li>Counts all users by role in the database</li>
                        <li>Updates the counters document in Firestore</li>
                        <li>Fixes discrepancies between actual users and counters</li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={handleFixCounters}
                    disabled={fixing || loading}
                    className="ml-4"
                  >
                    {fixing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Fix Counters
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Fix Enrollment Counters */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Fix Class Enrollment Counts</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will recalculate the number of students in each class based on active enrollment records.
                    </p>
                    <div className="space-y-2">
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        <li>Counts active enrollments for each class</li>
                        <li>Updates the "Students" count on the class record</li>
                        <li>Fixes discrepancies between displayed count and actual list</li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={handleFixEnrollments}
                    disabled={fixingEnrollments || loading}
                    className="ml-4"
                    variant="secondary"
                  >
                    {fixingEnrollments ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Fix Enrollments
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Regenerate User IDs */}
              <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-yellow-800">Regenerate User IDs</h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      <strong>⚠️ Advanced Operation:</strong> This will regenerate all user IDs based on their roles and creation order.
                      Only use this if user IDs are completely messed up.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-yellow-700">
                        <strong>What this does:</strong>
                      </p>
                      <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                        <li>Sorts users by creation date within each role</li>
                        <li>Assigns new sequential IDs (ADM001, TCH001, STD001, etc.)</li>
                        <li>Updates all user documents with new IDs</li>
                        <li>Updates counters to match new IDs</li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={handleRegenerateIds}
                    disabled={regenerating || loading}
                    variant="outline"
                    className="ml-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                  >
                    {regenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Regenerate IDs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-4">No users found</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        user.role === 'admin' ? 'bg-red-50 text-red-700' :
                          user.role === 'teacher' ? 'bg-blue-50 text-blue-700' :
                            'bg-green-50 text-green-700'
                      }>
                        {user.userId}
                      </Badge>
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}