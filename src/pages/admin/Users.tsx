import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  BookOpen,
  Eye,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { createUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "teacher": return <BookOpen className="h-4 w-4" />;
      case "student": return <GraduationCap className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-50 text-red-700 border-red-200";
      case "teacher": return "bg-blue-50 text-blue-700 border-blue-200";
      case "student": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === "active" ? "inactive" : "active";

      // Update in Firebase
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, status: newStatus }
          : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // Delete from Firebase
      await deleteDoc(doc(db, 'users', userId));

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      await createUser(formData.email, formData.password, formData.name, formData.role);

      // Refresh users list
      // Ideally we should just add the new user to the local state, but since createUser
      // does async work and ID generation, re-fetching or waiting might be safer.
      // For now let's just re-fetch or do a reload, or we can manually construct the user object.
      // Let's re-fetch to be safe and get the correct auto-ID.
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

      setFormData({ name: '', email: '', role: '', password: '' });
      setIsAddUserOpen(false);
      alert('User created successfully!');

    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.displayName,
      email: user.email,
      role: user.role
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        displayName: editFormData.name,
        email: editFormData.email,
        role: editFormData.role
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, displayName: editFormData.name, email: editFormData.email, role: editFormData.role }
          : u
      ));

      setIsEditUserOpen(false);
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewUserOpen(true);
  };

  return (
    <DashboardLayout
      role="admin"
      pageTitle="User Management"
      pageDescription="Manage system users and their permissions"
    >
      <div className="space-y-6">
        <UserProfile />

        <Tabs defaultValue="all-users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="add-user">Add User</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
          </TabsList>

          {/* All Users Tab */}
          <TabsContent value="all-users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Users ({filteredUsers.length})
                  </CardTitle>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Temporary Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter temporary password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1" disabled={creating}>
                            {creating ? 'Creating...' : 'Create User'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
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
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Users Table */}
                    <div className="space-y-3">
                      {filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No users found</p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{user.displayName}</p>
                                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                                    {user.role.toUpperCase()}
                                  </Badge>
                                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                    {user.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-xs text-muted-foreground">ID: {user.userId} • Created: {user.createdAt}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleUserStatus(user.id)}
                              >
                                {user.status === "active" ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add User Tab */}
          <TabsContent value="add-user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="Enter full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAddress">Email Address</Label>
                      <Input id="emailAddress" type="email" placeholder="Enter email address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Input id="department" placeholder="Enter department" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input id="phone" placeholder="Enter phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">Create User</Button>
                  <Button variant="outline">Reset Form</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Role Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {["admin", "teacher", "student"].map((role) => (
                    <div key={role} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {getRoleIcon(role)}
                        {role.charAt(0).toUpperCase() + role.slice(1)} Permissions
                      </h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked={role === "admin"} />
                          <span className="text-sm">View Dashboard</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked={role !== "student"} />
                          <span className="text-sm">Manage Classes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked={role !== "student"} />
                          <span className="text-sm">Take Attendance</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">View Reports</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked={role === "admin"} />
                          <span className="text-sm">Manage Users</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked={role === "admin"} />
                          <span className="text-sm">System Settings</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4">Save Permission Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Actions Tab */}
          <TabsContent value="bulk-actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk User Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Download className="h-6 w-6" />
                      <span>Export All Users</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Plus className="h-6 w-6" />
                      <span>Bulk Import Users</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <UserCheck className="h-6 w-6" />
                      <span>Activate Selected</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <UserX className="h-6 w-6" />
                      <span>Deactivate Selected</span>
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">User Statistics</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {users.filter(u => u.role === 'admin').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Admins</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {users.filter(u => u.role === 'teacher').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Teachers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {users.filter(u => u.role === 'student').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Students</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={updating}>
                {updating ? 'Updating...' : 'Update User'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.displayName}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role.toUpperCase()}
                    </Badge>
                    <Badge variant={selectedUser.status === "active" ? "default" : "secondary"}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-medium">{selectedUser.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{selectedUser.createdAt}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{selectedUser.status}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsViewUserOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewUserOpen(false);
                  handleEditUser(selectedUser);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
}