import { ATTENDANCE_THRESHOLDS } from "@/config/constants";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { ThemeSettings } from "@/components/ThemeSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Database, Users, Clock, Mail, Globe, User, Lock, Eye, EyeOff, Check, AlertTriangle, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchSystemSettings, updateSystemSettings, SystemSettings, defaultSettings } from "@/lib/settingsUtils";

export default function AdminSettings() {
  const { userData } = useAuth();
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Personal settings state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load system settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSystemSettings();
        setSystemSettings(settings);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load system settings');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSystemSettingChange = (category: keyof SystemSettings, field: string, value: string | boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSavingSettings(true);
    try {
      await updateSystemSettings(systemSettings);
      toast.success("Settings saved successfully!", {
        description: "System configuration has been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReset = async () => {
    try {
      setSystemSettings(defaultSettings);
      await updateSystemSettings(defaultSettings);
      toast.info("Settings reset to defaults.");
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error("Failed to reset settings. Please try again.");
    }
  };

  // Password change functionality
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, passwordData.newPassword);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before changing your password');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderSystemSettingInput = (category: keyof SystemSettings, field: string, value: string | boolean, type: 'text' | 'boolean' | 'select', options?: string[]) => {
    switch (type) {
      case 'boolean':
        return (
          <Switch
            checked={value as boolean}
            onCheckedChange={(checked) => handleSystemSettingChange(category, field, checked)}
          />
        );
      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={(newValue) => handleSystemSettingChange(category, field, newValue)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => handleSystemSettingChange(category, field, e.target.value)}
            className="w-48"
          />
        );
    }
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="System Settings"
      pageDescription="Configure system preferences and security settings"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system-security">System Security</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={userData?.displayName || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={userData?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin ID</Label>
                    <Input value={userData?.userId || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-50 text-red-700 border-red-200">
                        ADMINISTRATOR
                      </Badge>
                    </div>
                  </div>
                  {userData?.section && (
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input value={userData.section} disabled />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={userData?.status === 'active' ? 'default' : 'secondary'}>
                        {userData?.status?.toUpperCase() || 'ACTIVE'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>As an administrator, you can update your profile information through the system</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter your new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h3 className="font-semibold">Password Requirements</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Should contain a mix of letters and numbers</li>
                    <li>• Avoid using personal information</li>
                    <li>• Use a unique password not used elsewhere</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your admin account</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Login History</h4>
                      <p className="text-sm text-muted-foreground">View your recent admin login activity</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      View History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <ThemeSettings />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Personal Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Admin Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive system alerts and important updates</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">System Health Alerts</h4>
                      <p className="text-sm text-muted-foreground">Get notified about system issues and maintenance</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">User Activity Alerts</h4>
                      <p className="text-sm text-muted-foreground">Notifications about suspicious user activities</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Dashboard Layout</h4>
                      <p className="text-sm text-muted-foreground">Customize your dashboard layout and widgets</p>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className="text-sm text-muted-foreground">Select your preferred language</p>
                    </div>
                    <Badge variant="secondary">English</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic system configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">School Name</Label>
                        <p className="text-sm text-muted-foreground mt-1">The name of your educational institution</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('general', 'school_name', systemSettings.general.school_name, 'text')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Academic Year</Label>
                        <p className="text-sm text-muted-foreground mt-1">Current academic year period</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('general', 'academic_year', systemSettings.general.academic_year, 'text')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Timezone</Label>
                        <p className="text-sm text-muted-foreground mt-1">System timezone for attendance tracking</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('general', 'timezone', systemSettings.general.timezone, 'select', [
                          'GMT+00:00 Greenwich Mean Time',
                          'GMT+01:00 Central European Time',
                          'GMT+02:00 Eastern European Time',
                          'GMT+03:00 East African Time',
                          'GMT+04:00 Gulf Standard Time',
                          'GMT+05:00 Pakistan Standard Time',
                          'GMT+05:30 India Standard Time',
                          'GMT+06:00 Bangladesh Standard Time',
                          'GMT+07:00 Indochina Time',
                          'GMT+08:00 China Standard Time',
                          'GMT+09:00 Japan Standard Time',
                          'GMT+10:00 Australian Eastern Time',
                          'GMT-05:00 Eastern Standard Time',
                          'GMT-06:00 Central Standard Time',
                          'GMT-07:00 Mountain Standard Time',
                          'GMT-08:00 Pacific Standard Time'
                        ])}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Language</Label>
                        <p className="text-sm text-muted-foreground mt-1">System display language</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('general', 'language', systemSettings.general.language, 'select', [
                          'English',
                          'Spanish',
                          'French',
                          'German',
                          'Arabic',
                          'Chinese',
                          'Hindi',
                          'Portuguese'
                        ])}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Settings */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Attendance Settings
                </CardTitle>
                <CardDescription>
                  Configure attendance tracking preferences and rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Auto Mark Absent</Label>
                        <p className="text-sm text-muted-foreground mt-1">Automatically mark students as absent if not marked present</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('attendance', 'auto_mark_absent', systemSettings.attendance.auto_mark_absent, 'boolean')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Attendance Window (minutes)</Label>
                        <p className="text-sm text-muted-foreground mt-1">Time window for marking attendance after class starts</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('attendance', 'attendance_window', systemSettings.attendance.attendance_window, 'text')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Late Threshold (minutes)</Label>
                        <p className="text-sm text-muted-foreground mt-1">Minutes after which a student is marked as late</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('attendance', 'late_threshold', systemSettings.attendance.late_threshold, 'text')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Require Reason</Label>
                        <p className="text-sm text-muted-foreground mt-1">Require reason when marking students absent</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('attendance', 'require_reason', systemSettings.attendance.require_reason, 'boolean')}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure email and system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground mt-1">Send email notifications to users</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('notifications', 'email_notifications', systemSettings.notifications.email_notifications, 'boolean')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Parent Notifications</Label>
                        <p className="text-sm text-muted-foreground mt-1">Send notifications to parents about attendance</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('notifications', 'parent_notifications', systemSettings.notifications.parent_notifications, 'boolean')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Low Attendance Alert</Label>
                        <p className="text-sm text-muted-foreground mt-1">Alert when student attendance falls below threshold</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('notifications', 'low_attendance_alert', systemSettings.notifications.low_attendance_alert, 'boolean')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <Label className="text-base font-medium">Attendance Threshold (%)</Label>
                        <p className="text-sm text-muted-foreground mt-1">Minimum attendance percentage before triggering alerts</p>
                      </div>
                      <div className="ml-4">
                        {renderSystemSettingInput('notifications', 'attendance_threshold', systemSettings.notifications.attendance_threshold, 'text')}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Security Settings */}
          <TabsContent value="system-security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage user permissions and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground mt-1">Require 2FA for admin accounts</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Session Timeout</Label>
                      <p className="text-sm text-muted-foreground mt-1">Auto logout after inactivity (minutes)</p>
                    </div>
                    <Input type="number" defaultValue="30" className="w-24" />
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Password Policy</Label>
                      <p className="text-sm text-muted-foreground mt-1">Enforce strong password requirements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Login Attempts</Label>
                      <p className="text-sm text-muted-foreground mt-1">Maximum failed login attempts before lockout</p>
                    </div>
                    <Input type="number" defaultValue="5" className="w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Backup & Data Settings
                </CardTitle>
                <CardDescription>
                  Configure data backup and recovery options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground mt-1">Enable automatic daily backups</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Backup Frequency</Label>
                      <p className="text-sm text-muted-foreground mt-1">How often to create backups</p>
                    </div>
                    <Select defaultValue="daily">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Retention Period</Label>
                      <p className="text-sm text-muted-foreground mt-1">How long to keep backup files (days)</p>
                    </div>
                    <Input type="number" defaultValue="30" className="w-24" />
                  </div>
                  <div className="py-4">
                    <div className="flex space-x-4">
                      <Button>Create Backup Now</Button>
                      <Button variant="outline">Restore from Backup</Button>
                      <Button variant="outline">Download Backup</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Settings */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  External Integrations
                </CardTitle>
                <CardDescription>
                  Configure integrations with external systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Google Classroom</Label>
                      <p className="text-sm text-muted-foreground mt-1">Sync with Google Classroom</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Not Connected</Badge>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Microsoft Teams</Label>
                      <p className="text-sm text-muted-foreground mt-1">Integrate with Microsoft Teams</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Not Connected</Badge>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b">
                    <div className="flex-1">
                      <Label className="text-base font-medium">SMS Gateway</Label>
                      <p className="text-sm text-muted-foreground mt-1">Send SMS notifications to parents</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Connected</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <Label className="text-base font-medium">Student Information System</Label>
                      <p className="text-sm text-muted-foreground mt-1">Sync with existing SIS</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Not Connected</Badge>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Settings */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleReset} disabled={loadingSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={loadingSettings || savingSettings} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {savingSettings ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}