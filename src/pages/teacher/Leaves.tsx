import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
    FileText,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    MessageSquare,
    AlertCircle,
    User
} from "lucide-react";
import { useState, useEffect } from "react";
import { subscribeToTeacherLeaveRequests, updateLeaveRequestStatus, type LeaveRequest } from "@/lib/leaveUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeacherLeaves() {
    const { userData, loading } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveLoading, setLeaveLoading] = useState(true);
    const [reviewData, setReviewData] = useState({
        requestId: '',
        comments: '',
        status: '' as 'approved' | 'rejected'
    });
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (!userData?.userId) return;

        // Subscribe to leave requests for this teacher only
        const unsubscribeLeave = subscribeToTeacherLeaveRequests(userData.userId, (teacherRequests) => {
            // Sort by submittedAt desc
            const sorted = [...teacherRequests].sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
            setLeaveRequests(sorted);
            setLeaveLoading(false);
        });

        return () => unsubscribeLeave();
    }, [userData]);

    const handleReviewLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.displayName) {
            toast.error("User profile not loaded");
            return;
        }

        try {
            setSubmittingReview(true);
            await updateLeaveRequestStatus(
                reviewData.requestId,
                reviewData.status,
                userData.displayName,
                reviewData.comments
            );

            toast.success(`Leave request ${reviewData.status} successfully`);
            setIsReviewDialogOpen(false);
            setReviewData({ requestId: '', comments: '', status: 'approved' });
        } catch (error) {
            console.error("Failed to update leave request:", error);
            toast.error("Failed to update leave request");
        } finally {
            setSubmittingReview(false);
        }
    };

    const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
    const pastRequests = leaveRequests.filter(r => r.status !== 'pending');

    return (
        <DashboardLayout
            role="teacher"
            pageTitle="Leave Requests"
            pageDescription="Manage and review student leave requests"
        >
            <div className="space-y-6">
                <UserProfile />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
                            <p className="text-sm text-muted-foreground">Pending Requests</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {leaveRequests.filter(r => r.status === 'approved').length}
                            </div>
                            <p className="text-sm text-muted-foreground">Approved Leaves</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{leaveRequests.length}</div>
                            <p className="text-sm text-muted-foreground">Total History</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Active Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaveLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                                        <CheckCircle2 className="h-12 w-12 text-green-600/30 mx-auto mb-3" />
                                        <p className="text-muted-foreground font-medium">All caught up! No pending requests.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingRequests.map((request) => (
                                            <Card key={request.id} className="border-l-4 border-l-yellow-400 shadow-sm">
                                                <CardContent className="p-5">
                                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                                        <div className="space-y-2 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <User className="h-4 w-4 text-primary" />
                                                                <h3 className="font-bold text-lg">{request.studentName}</h3>
                                                                {request.section && (
                                                                    <Badge variant="outline" className="text-xs">Section: {request.section}</Badge>
                                                                )}
                                                                <Badge variant="secondary" className="bg-primary/5">{request.type}</Badge>
                                                                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                                                    Pending Review
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-2 font-medium">
                                                                    <Calendar className="h-4 w-4 text-primary" />
                                                                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4" />
                                                                    Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm italic border-l-2 border-muted">
                                                                <span className="font-bold block not-italic mb-1 opacity-70">Reason:</span>
                                                                "{request.reason}"
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-row md:flex-col gap-2 shrink-0">
                                                            <Button
                                                                className="flex-1 md:w-full bg-green-600 hover:bg-green-700"
                                                                onClick={() => {
                                                                    setReviewData({ requestId: request.id, comments: '', status: 'approved' });
                                                                    setIsReviewDialogOpen(true);
                                                                }}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                className="flex-1 md:w-full"
                                                                onClick={() => {
                                                                    setReviewData({ requestId: request.id, comments: '', status: 'rejected' });
                                                                    setIsReviewDialogOpen(true);
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {pastRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg opacity-80">Request History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pastRequests.map((request) => (
                                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg opacity-80 bg-muted/5">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold">{request.studentName}</span>
                                                <Badge variant="outline" className="text-[10px] h-4">{request.type}</Badge>
                                                <Badge className={cn(
                                                    "text-[10px] h-4",
                                                    request.status === 'approved' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    {request.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                            </p>
                                            {request.comments && (
                                                <p className="text-xs mt-2 italic text-muted-foreground border-l-2 border-primary/20 pl-2">
                                                    Remark: {request.comments}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right text-[10px] text-muted-foreground">
                                            Reviewed: {new Date(request.reviewedAt || '').toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{reviewData.status === 'approved' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
                        <DialogDescription>
                            Add a comment or feedback for the student regarding this request.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReviewLeave}>
                        <div className="py-4">
                            <Label htmlFor="reviewComments" className="block mb-2">Review Comments</Label>
                            <Textarea
                                id="reviewComments"
                                placeholder="e.g. Please bring medical certificate upon return."
                                className="min-h-[100px]"
                                value={reviewData.comments}
                                onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                                required={reviewData.status === 'rejected'}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className={reviewData.status === 'approved' ? "bg-green-600 hover:bg-green-700" : ""}
                                disabled={submittingReview}
                            >
                                {submittingReview ? "Processing..." : `Confirm ${reviewData.status === 'approved' ? 'Approval' : 'Rejection'}`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
