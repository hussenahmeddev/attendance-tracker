import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ClassAssignmentDialog } from "@/components/admin/ClassAssignmentDialog";
import { useAuth } from "@/contexts/AuthContext";
import { generateSecurePassword } from "@/lib/authUtils";
import { updatePassword, signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { auth, getSecondaryApp } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchAllClasses } from "@/lib/classUtils";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Key,
  Upload,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  GraduationCap,
  BookOpen,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Settings,
  Link
} from "lucide-react";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  grade?: string;
  section?: string;
  enrolledClasses?: string[];
  teachingClasses?: string[];
  deleted?: boolean;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  teacherId: string;
}

export default function UserManagement() {
  const { userData, createUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [userForPasswordReset, setUserForPasswordReset] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    role: "student" as User['role'],
    phone: "",
    grade: "",
    section: "",
    status: "active" as User['status'],
    temporaryPassword: ""
  });

  // Fetch users and classes
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users from Firestore (these are keyed by Firebase Auth UID)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      const usersData = usersSnapshot.docs
        .map(doc => ({
          id: doc.id, // This is the Firebase Auth UID
          ...doc.data()
        } as User))
        .filter(user => !user.deleted);

      // Fetch classes for assignments
      const classesData = await fetchAllClasses();
      
      setUsers(usersData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Generate random password
  const generateRandomPassword = () => {
    const password = generateSecurePassword(8);
    setFormData({...formData, temporaryPassword: password});
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      if (!formData.temporaryPassword) {
        toast.error('Please enter a temporary password');
        return;
      }

      if (formData.temporaryPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      // Create user in Firebase Authentication and Firestore
      await createUser(
        formData.email,
        formData.temporaryPassword,
        formData.displayName,
        formData.role,
        formData.section
      );
      
      // Show success message with password info
      toast.success(
        `${formData.role} created successfully!\n\nEmail: ${formData.email}\nTemporary Password: ${formData.temporaryPassword}\n\nUser can now login and must change password on first login.`,
        { duration: 10000 }
      );
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        phone: formData.phone,
        grade: formData.grade,
        section: formData.section,
        updatedAt: new Date().toISOString()
      });

      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      // Use soft delete since Firebase Client SDK cannot delete Auth users
      // and Firestore rules typically prevent document deletion
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'deactivate',
        deleted: true,
        updatedAt: new Date().toISOString()
      });
      toast.success('User deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message || error}`);
    }
  };

  // Reset password (admin enters new password manually)
  const handleResetPassword = async (user: User) => {
    setUserForPasswordReset(user);
    setNewPassword("");
    setIsResetPasswordOpen(true);
  };

  const confirmPasswordReset = async () => {
    if (!userForPasswordReset || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      // Store the new password temporarily and send reset email
      const userRef = doc(db, 'users', userForPasswordReset.id);
      await updateDoc(userRef, {
        adminResetPassword: newPassword, // Store admin's chosen password
        mustChangePassword: true,
        passwordResetAt: new Date().toISOString(),
        passwordResetBy: userData?.displayName || 'Admin'
      });

      toast.success(
        `Password reset initiated!\n\nUser: ${userForPasswordReset.displayName}\nEmail: ${userForPasswordReset.email}\n\nIMPORTANT INSTRUCTIONS:\n1. Tell user to click "Forgot Password" on login page\n2. User will receive email with reset link\n3. When they reset, tell them to use: ${newPassword}\n4. They must change this password after login`,
        { duration: 20000 }
      );

      setIsResetPasswordOpen(false);
      setNewPassword("");
      setUserForPasswordReset(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(`Failed to reset password: ${error.message}`);
    }
  };

  // Bulk import from CSV
  const handleBulkImport = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const users = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const user: any = {};
          headers.forEach((header, index) => {
            user[header] = values[index] || '';
          });
          
          // Validate required fields
          if (!user.displayName || !user.email || !user.role) {
            toast.error(`Row ${i + 1}: Missing required fields (displayName, email, role)`);
            return;
          }

          // Validate temporary password
          if (!user.temporaryPassword) {
            toast.error(`Row ${i + 1}: Temporary password is required for ${user.displayName}`);
            return;
          }

          if (user.temporaryPassword.length < 6) {
            toast.error(`Row ${i + 1}: Password must be at least 6 characters for ${user.displayName}`);
            return;
          }
          
          users.push(user);
        }
      }

      if (users.length === 0) {
        toast.error('No valid users found in CSV');
        return;
      }

      // Create users one by one using Firebase Auth
      let successCount = 0;
      let errorCount = 0;
      
      for (const user of users) {
        try {
          await createUser(
            user.email,
            user.temporaryPassword,
            user.displayName,
            user.role,
            user.section || ''
          );
          successCount++;
        } catch (error: any) {
          console.error(`Error creating user ${user.displayName}:`, error);
          errorCount++;
          toast.error(`Failed to create ${user.displayName}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} users. ${errorCount} failed.`);
        setIsBulkImportOpen(false);
        setCsvFile(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Failed to import users');
    }
  };

  // Export users to CSV
  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Phone', 'Grade', 'Section', 'Created'].join(','),
      ...filteredUsers.map(user => [
        user.displayName,
        user.email,
        user.role,
        user.status,
        user.phone || '',
        user.grade || '',
        user.section || '',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      displayName: "",
      email: "",
      role: "student",
      phone: "",
      grade: "",
      section: "",
      status: "active",
      temporaryPassword: ""
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      grade: user.grade || "",
      section: user.section || "",
      status: user.status,
      temporaryPassword: ""
    });
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      case 'student': return <BookOpen className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" pageTitle="User Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" pageTitle="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage teachers, students, and administrators</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
              <Link className="h-4 w-4 mr-2" />
              Assign Classes
            </Button>
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Import Users</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      CSV must include: displayName, email, role, temporaryPassword (required for each user)
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkImport} disabled={!csvFile}>
                      Import Users
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone (Optional)</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>Temporary Password *</Label>
                    <Input
                      type="text"
                      value={formData.temporaryPassword}
                      onChange={(e) => setFormData({...formData, temporaryPassword: e.target.value})}
                      placeholder="Enter temporary password (min 6 characters)"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      User will be required to change this password on first login
                    </p>
                  </div>
                  {formData.role === 'student' && (
                    <>
                      <div>
                        <Label>Grade</Label>
                        <Input
                          value={formData.grade}
                          onChange={(e) => setFormData({...formData, grade: e.target.value})}
                          placeholder="Enter grade"
                        />
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Input
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value})}
                          placeholder="Enter section"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Create User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Class Assignment Dialog */}
        <ClassAssignmentDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onAssignmentComplete={fetchData}
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.grade && user.section && (
                            <div className="text-xs text-muted-foreground">
                              Grade {user.grade} - Section {user.section}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.status === 'active' ? 
                              <ShieldOff className="h-4 w-4" /> : 
                              <Shield className="h-4 w-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.displayName}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value: User['role']) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: User['status']) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              {formData.role === 'student' && (
                <>
                  <div>
                    <Label>Grade</Label>
                    <Input
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Input
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Update User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            {userForPasswordReset && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{userForPasswordReset.displayName}</p>
                  <p className="text-sm text-muted-foreground">{userForPasswordReset.email}</p>
                  <p className="text-sm text-muted-foreground">Role: {userForPasswordReset.role}</p>
                </div>
                
                <div>
                  <Label>New Password *</Label>
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    User must use "Forgot Password" on login page, then use this password when resetting.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Instructions for user:</strong><br/>
                    1. Go to login page and click "Forgot Password"<br/>
                    2. Check email for reset link<br/>
                    3. Use this password when resetting: <strong>{newPassword}</strong><br/>
                    4. Must change password after first login
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsResetPasswordOpen(false);
                      setNewPassword("");
                      setUserForPasswordReset(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmPasswordReset}
                    disabled={!newPassword || newPassword.length < 6}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}