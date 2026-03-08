import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react";
import { STATUS_COLORS } from "@/config/constants";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  submitLeaveRequest, 
  subscribeToStudentLeaveRequests, 
  updateLeaveRequest,
  cancelLeaveRequest,
  getStudentAssignedTeacher,
  type LeaveRequest 
} from "@/lib/leaveUtils";
import { toast } from "sonner";

export default function StudentLeaveRequest() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<{ teacherId: string; teacherName: string; classId?: string; className?: string } | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (!userData?.userId) {
      setLoading(false);
      return;
    }

    // Get student's assigned teacher
    const fetchTeacher = async () => {
      const teacher = await getStudentAssignedTeacher(userData.userId);
      setTeacherInfo(teacher);
    };
    fetchTeacher();

    setLoading(true);
    const unsubscribe = subscribeToStudentLeaveRequests(userData.userId, (data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe && typeof unsubscribe === 'function' ? unsubscribe() : undefined;
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.userId || !teacherInfo) {
      toast.error("Unable to submit. Teacher assignment not found.");
      return;
    }

    if (!formData.type) {
      toast.error("Please select a leave type");
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setSubmitting(true);
      await submitLeaveRequest({
        studentId: userData.userId,
        studentName: userData.displayName || 'Anonymous Student',
        studentEmail: userData.email,
        teacherId: teacherInfo.teacherId,
        teacherName: teacherInfo.teacherName,
        classId: teacherInfo.classId,
        className: teacherInfo.className,
        section: userData.section,
        type: formData.type as 'Sick' | 'Personal' | 'Emergency' | 'Other',
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });

      toast.success("Leave request submitted successfully");
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      toast.error("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setSubmitting(true);
      await updateLeaveRequest(editingRequest.id, {
        type: formData.type as 'Sick' | 'Personal' | 'Emergency' | 'Other',
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });

      toast.success("Leave request updated successfully");
      setIsEditDialogOpen(false);
      setEditingRequest(null);
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
    } catch (error: any) {
      console.error("Failed to update leave request:", error);
      toast.error(error.message || "Failed to update leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    try {
      await cancelLeaveRequest(requestId);
      toast.success("Leave request cancelled");
    } catch (error: any) {
      console.error("Failed to cancel leave request:", error);
      toast.error(error.message || "Failed to cancel leave request");
    }
  };

  const openEditDialog = (request: LeaveRequest) => {
    setEditingRequest(request);
    setFormData({
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason
    });
    setIsEditDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className={STATUS_COLORS.APPROVED}>Approved</Badge>;
      case 'rejected':
        return <Badge className={STATUS_COLORS.REJECTED}>Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge className={STATUS_COLORS.PENDING}>Pending</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <DashboardLayout
      role="student"
      pageTitle="Leave Requests"
      pageDescription="Submit and track your leave requests"
    >
      <div className="space-y-6">
        <UserProfile />

        {/* Teacher Assignment Info */}
        {teacherInfo && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="font-medium">Assigned Teacher:</div>
                <div className="text-muted-foreground">{teacherInfo.teacherName}</div>
                {teacherInfo.className && (
                  <>
                    <div className="text-muted-foreground">•</div>
                    <div className="text-muted-foreground">Class: {teacherInfo.className}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!teacherInfo && !loading && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <div>No teacher assigned. Please contact your administrator to assign you to a class.</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Leave Requests
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!teacherInfo}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Leave Request</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Leave Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sick">Sick Leave</SelectItem>
                          <SelectItem value="Personal">Personal Leave</SelectItem>
                          <SelectItem value="Emergency">Emergency Leave</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please provide a detailed reason for your leave request..."
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Request"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
                  <p className="text-muted-foreground">Loading leave requests...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No leave requests found</p>
                    <p className="text-sm text-muted-foreground">Submit your first leave request to get started</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold">{request.type}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                              </div>
                              {request.reviewedAt && (
                                <div className="flex items-center gap-2 text-primary font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Reviewed: {new Date(request.reviewedAt).toLocaleDateString()} by {request.reviewedBy}
                                </div>
                              )}
                            </div>
                            <p className="text-sm mt-2 text-foreground">{request.reason}</p>
                            {request.comments && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm border-l-4 border-blue-500">
                                <div className="font-bold mb-1 text-blue-700">Teacher's Note:</div>
                                <div className="text-blue-900">{request.comments}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(request)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCancel(request.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Leave Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Personal">Personal Leave</SelectItem>
                    <SelectItem value="Emergency">Emergency Leave</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reason">Reason</Label>
                <Textarea
                  id="edit-reason"
                  placeholder="Please provide a detailed reason for your leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Request"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Submit requests in advance</p>
                  <p className="text-muted-foreground">Submit leave requests at least 48 hours before the intended leave date.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Provide detailed reasons</p>
                  <p className="text-muted-foreground">Include specific details about why you need the leave for faster approval.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Supporting documents</p>
                  <p className="text-muted-foreground">For medical leave, attach medical certificates or doctor's notes when possible.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Approved leaves update attendance</p>
                  <p className="text-muted-foreground">When your leave is approved, your attendance will automatically be marked as "Excused" for those dates.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
