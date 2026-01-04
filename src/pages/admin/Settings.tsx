import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Shield, Database, Users, Clock, Mail, Globe } from "lucide-react";

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | boolean;
  type: 'text' | 'boolean' | 'select' | 'number';
  options?: string[];
}

const generalSettings: SystemSetting[] = [
  {
    id: 'school_name',
    name: 'School Name',
    description: 'The name of your educational institution',
    value: 'Springfield High School',
    type: 'text'
  },
  {
    id: 'academic_year',
    name: 'Academic Year',
    description: 'Current academic year',
    value: '2024-2025',
    type: 'text'
  },
  {
    id: 'timezone',
    name: 'Timezone',
    description: 'System timezone for attendance tracking',
    value: 'UTC+05:30',
    type: 'select',
    options: ['UTC+05:30', 'UTC+00:00', 'UTC-05:00', 'UTC+08:00']
  },
  {
    id: 'language',
    name: 'Default Language',
    description: 'System default language',
    value: 'English',
    type: 'select',
    options: ['English', 'Spanish', 'French', 'German']
  }
];

const attendanceSettings: SystemSetting[] = [
  {
    id: 'auto_mark_absent',
    name: 'Auto Mark Absent',
    description: 'Automatically mark students as absent if not marked within time limit',
    value: true,
    type: 'boolean'
  },
  {
    id: 'attendance_window',
    name: 'Attendance Window (minutes)',
    description: 'Time window for marking attendance after class starts',
    value: '15',
    type: 'number'
  },
  {
    id: 'late_threshold',
    name: 'Late Threshold (minutes)',
    description: 'Minutes after which a student is marked as late',
    value: '10',
    type: 'number'
  },
  {
    id: 'require_reason',
    name: 'Require Absence Reason',
    description: 'Require teachers to provide reason for marking absent',
    value: false,
    type: 'boolean'
  }
];

const notificationSettings: SystemSetting[] = [
  {
    id: 'email_notifications',
    name: 'Email Notifications',
    description: 'Send email notifications for important events',
    value: true,
    type: 'boolean'
  },
  {
    id: 'parent_notifications',
    name: 'Parent Notifications',
    description: 'Send notifications to parents about attendance',
    value: true,
    type: 'boolean'
  },
  {
    id: 'low_attendance_alert',
    name: 'Low Attendance Alerts',
    description: 'Alert when student attendance falls below threshold',
    value: true,
    type: 'boolean'
  },
  {
    id: 'attendance_threshold',
    name: 'Attendance Threshold (%)',
    description: 'Minimum attendance percentage before alert',
    value: '75',
    type: 'number'
  }
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    general: generalSettings,
    attendance: attendanceSettings,
    notifications: notificationSettings
  });

  const handleSettingChange = (category: string, settingId: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev].map(setting =>
        setting.id === settingId ? { ...setting, value } : setting
      )
    }));
  };

  const renderSettingInput = (setting: SystemSetting, category: string) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value as boolean}
            onCheckedChange={(checked) => handleSettingChange(category, setting.id, checked)}
          />
        );
      case 'select':
        return (
          <Select
            value={setting.value as string}
            onValueChange={(value) => handleSettingChange(category, setting.id, value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
      case 'text':
        return (
          <Input
            type={setting.type}
            value={setting.value as string}
            onChange={(e) => handleSettingChange(category, setting.id, e.target.value)}
            className="w-48"
          />
        );
      default:
        return null;
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

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

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
                {settings.general.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <Label className="text-base font-medium">{setting.name}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderSettingInput(setting, 'general')}
                    </div>
                  </div>
                ))}
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
                {settings.attendance.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <Label className="text-base font-medium">{setting.name}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderSettingInput(setting, 'attendance')}
                    </div>
                  </div>
                ))}
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
                {settings.notifications.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <Label className="text-base font-medium">{setting.name}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderSettingInput(setting, 'notifications')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
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
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save All Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}