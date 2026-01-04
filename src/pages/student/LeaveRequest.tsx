import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Clock, XCircle, Plus, FileText, Calendar } from "lucide-react";

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'sick' | 'personal' | 'emergency' | 'family';
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  approvedBy?: string;
  comments?: string;
}

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    reason: 'Medical appointment and recovery',
    type: 'sick',
    status: 'approved',
    submittedDate: '2024-01-18',
    approvedBy: 'Dr. Smith',
    comments: 'Medical certificate provided'
  },
  {
    id: '2',
    startDate: '2024-01-15',
    endDate: '2024-01-15',
    reason: 'Family wedding ceremony',
    type: 'family',
    status: 'pending',
    submittedDate: '2024-01-10'
  },
  {
    id: '3',
    startDate: '2024-01-08',
    endDate: '2024-01-09',
    reason: 'Personal emergency',
    type: 'emergency',
    status: 'rejected',
    submittedDate: '2024-01-05',
    approvedBy: 'Prof. Johnson',
    comments: 'Insufficient documentation provided'
  }
];

export default function StudentLeaveRequest() {
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'personal'
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'family': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setRequests([newRequest, ...requests]);
    setFormData({ startDate: '', endDate: '', reason: '', type: 'personal' });
    setIsDialogOpen(false);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalDaysRequested = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + calculateDays(r.startDate, r.endDate), 0);

  return (
    <DashboardLayout
      role="student"
      pageTitle="Leave Requests"
      pageDescription="Submit and manage your leave requests"
    >
      <div className="space-y-6">
        <UserProfile />
        
        {/* Header with New Request Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Leave Requests</h2>
            <p className="text-muted-foreground">Submit and track your leave applications</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>
                  Fill out the form below to submit a new leave request.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Leave Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">
                All time requests
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Taken</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDaysRequested}</div>
              <p className="text-xs text-muted-foreground">
                This academic year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
            <CardDescription>
              View and track all your submitted leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">
                          {formatDate(request.startDate)} 
                          {request.startDate !== request.endDate && ` - ${formatDate(request.endDate)}`}
                        </h3>
                        <Badge className={getTypeColor(request.type)}>
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Duration: {calculateDays(request.startDate, request.endDate)} day(s)
                      </p>
                      <p className="text-sm mb-2">{request.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {formatDate(request.submittedDate)}
                        {request.approvedBy && ` • Reviewed by: ${request.approvedBy}`}
                      </p>
                      {request.comments && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Comments:</strong> {request.comments}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Guidelines</CardTitle>
            <CardDescription>
              Important information about submitting leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Submission Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Submit requests at least 3 days in advance</li>
                  <li>• Provide detailed reason for leave</li>
                  <li>• Medical certificate required for sick leave &gt; 2 days</li>
                  <li>• Emergency requests may be submitted retrospectively</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Leave Policies</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maximum 15 days of leave per academic year</li>
                  <li>• Attendance must remain above 75%</li>
                  <li>• Approval depends on academic standing</li>
                  <li>• Make-up assignments may be required</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}