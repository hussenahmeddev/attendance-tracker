import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ChangePasswordDialog() {
    const { currentUser, userData, logout } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Only show if user is logged in and must change password
    // Also check if we are NOT in test mode (unless we want to test this specifically)
    const isOpen = !!currentUser && userData?.mustChangePassword === true;

    // Temporary fix for test mode if needed, but assuming test mode mocks usually don't have mustChangePassword=true
    // unless specified.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            if (auth.currentUser) {
                // Update password in Auth
                await updatePassword(auth.currentUser, newPassword);

                // Update Firestore to clear the flag
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    mustChangePassword: false
                });

                // Optional: Force logout or just close modal?
                // Usually better to let them stay logged in with new password.
                // But the user data needs to refresh in context.
                // The onAuthStateChanged might not trigger a db refetch instantly, 
                // so we might need to manually update local state or just reload.
                // For simplicity, let's reload the page which will re-fetch userData.
                window.location.reload();
            }
        } catch (err: any) {
            console.error("Error updating password:", err);
            // If error is "requires recent login", we might need to re-authenticate.
            // But since they just logged in, it should be fine.
            setError(err.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Change Password Required</DialogTitle>
                    <DialogDescription>
                        For security reasons, you must change your password before continuing.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-between">
                        <Button type="button" variant="outline" onClick={handleLogout}>
                            Logout
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
