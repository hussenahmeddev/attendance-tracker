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
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

export default function StudentLeaveRequest() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setRequests(prev => [newRequest, ...prev]);
    setFormData({ type: '', startDate: '', endDate: '', reason: '' });
    setIsDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
                  <Button>
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
                          <SelectItem value="Medical Leave">Medical Leave</SelectItem>
                          <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                          <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                          <SelectItem value="Family Leave">Family Leave</SelectItem>
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
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Submit Request</Button>
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
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(request.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
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
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Reviewed: {new Date(request.reviewedAt).toLocaleDateString()} by {request.reviewedBy}
                                </div>
                              )}
                            </div>
                            <p className="text-sm mt-2">{request.reason}</p>
                            {request.comments && (
                              <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                                <strong>Comments:</strong> {request.comments}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Submit requests in advance</p>
                  <p className="text-muted-foreground">Submit leave requests at least 48 hours before the intended leave date.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Provide detailed reasons</p>
                  <p className="text-muted-foreground">Include specific details about why you need the leave for faster approval.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Supporting documents</p>
                  <p className="text-muted-foreground">For medical leave, attach medical certificates or doctor's notes when possible.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}