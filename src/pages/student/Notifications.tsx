import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  CheckCircle2, 
  Settings,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentNotifications() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout
      role="student"
      pageTitle="Notifications"
      pageDescription="Stay updated with important announcements and reminders"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  All Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading notifications...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Welcome Notification */}
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg border-primary bg-primary/5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">Welcome to EduTrack!</h3>
                                <Badge className="bg-green-100 text-green-800">System</Badge>
                                <Badge className="bg-blue-100 text-blue-800">New</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Hello {userData?.displayName || 'Student'}! Welcome to the attendance tracking system. 
                                Your student ID is {userData?.userId || 'N/A'}.
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date().toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center py-8">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">You're all caught up!</p>
                        <p className="text-sm text-muted-foreground">
                          New notifications will appear here when there are updates from your teachers or the system.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="attendance-emails">Attendance Reminders</Label>
                          <p className="text-sm text-muted-foreground">Get email reminders about upcoming classes</p>
                        </div>
                        <Switch id="attendance-emails" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="grade-emails">Grade Updates</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications when grades are posted</p>
                        </div>
                        <Switch id="grade-emails" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="announcement-emails">Announcements</Label>
                          <p className="text-sm text-muted-foreground">Get important school announcements via email</p>
                        </div>
                        <Switch id="announcement-emails" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="class-reminders">Class Reminders</Label>
                          <p className="text-sm text-muted-foreground">Get notified 15 minutes before class starts</p>
                        </div>
                        <Switch id="class-reminders" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="assignment-due">Assignment Due Dates</Label>
                          <p className="text-sm text-muted-foreground">Reminders for upcoming assignment deadlines</p>
                        </div>
                        <Switch id="assignment-due" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button>Save Preferences</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}