import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, CheckCircle2, AlertTriangle, Info, X, Settings, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'attendance' | 'academic' | 'system' | 'leave';
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Low Attendance Warning',
    message: 'Your attendance in Physics has dropped to 72%. Please maintain at least 75% attendance.',
    type: 'warning',
    category: 'attendance',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    actionRequired: true
  },
  {
    id: '2',
    title: 'Leave Request Approved',
    message: 'Your leave request for January 20-22 has been approved by Dr. Smith.',
    type: 'success',
    category: 'leave',
    timestamp: '2024-01-14T14:20:00Z',
    read: false
  },
  {
    id: '3',
    title: 'Assignment Reminder',
    message: 'Physics project submission deadline is approaching (Due: January 28).',
    type: 'info',
    category: 'academic',
    timestamp: '2024-01-13T09:00:00Z',
    read: true
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'The attendance system will be under maintenance on January 16 from 2:00 AM to 4:00 AM.',
    type: 'info',
    category: 'system',
    timestamp: '2024-01-12T16:45:00Z',
    read: true
  },
  {
    id: '5',
    title: 'Perfect Attendance Achievement',
    message: 'Congratulations! You have maintained 100% attendance in Mathematics this month.',
    type: 'success',
    category: 'attendance',
    timestamp: '2024-01-11T12:00:00Z',
    read: true
  },
  {
    id: '6',
    title: 'Class Schedule Change',
    message: 'Chemistry lab session on January 17 has been moved from Lab 301 to Lab 302.',
    type: 'warning',
    category: 'academic',
    timestamp: '2024-01-10T11:30:00Z',
    read: false
  }
];

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    attendance: true,
    academic: true,
    system: false,
    leave: true,
    email: true,
    push: true
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <X className="h-5 w-5 text-red-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attendance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'academic': return 'bg-green-100 text-green-800 border-green-200';
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'leave': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'action') return notif.actionRequired;
    return notif.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  return (
    <DashboardLayout
      role="student"
      pageTitle="Notifications"
      pageDescription="Stay updated with important announcements and alerts"
    >
      <div className="space-y-6">
        <UserProfile />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">Stay updated with important information</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Required</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{actionRequiredCount}</div>
              <p className="text-xs text-muted-foreground">Require response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">Recent activity</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter notifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="action">Action Required</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="leave">Leave Requests</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Settings */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Customize which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Categories</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="attendance-notif">Attendance Alerts</Label>
                      <Switch
                        id="attendance-notif"
                        checked={notificationSettings.attendance}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, attendance: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="academic-notif">Academic Updates</Label>
                      <Switch
                        id="academic-notif"
                        checked={notificationSettings.academic}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, academic: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="leave-notif">Leave Requests</Label>
                      <Switch
                        id="leave-notif"
                        checked={notificationSettings.leave}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, leave: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-notif">System Notifications</Label>
                      <Switch
                        id="system-notif"
                        checked={notificationSettings.system}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, system: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Delivery Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notif">Email Notifications</Label>
                      <Switch
                        id="email-notif"
                        checked={notificationSettings.email}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, email: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notif">Push Notifications</Label>
                      <Switch
                        id="push-notif"
                        checked={notificationSettings.push}
                        onCheckedChange={(checked) => 
                          setNotificationSettings({...notificationSettings, push: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              {filteredNotifications.length} notification(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 rounded-lg ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'border-2 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <Badge className={getCategoryColor(notification.category)}>
                            {notification.category}
                          </Badge>
                          {notification.actionRequired && (
                            <Badge variant="destructive">Action Required</Badge>
                          )}
                          {!notification.read && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications found for the selected filter.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}