import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changeUserPassword, validatePasswordStrength } from "@/lib/authUtils";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";

interface PasswordChangeDialogProps {
  open: boolean;
  user: any;
  onPasswordChanged: () => void;
}

export function PasswordChangeDialog({ open, user, onPasswordChanged }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const passwordValidation = validatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handlePasswordChange = async () => {
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    if (user.temporaryPassword && currentPassword !== user.temporaryPassword) {
      toast.error('Current password is incorrect');
      return;
    }

    setIsChanging(true);
    try {
      const success = await changeUserPassword(user.id, newPassword);
      
      if (success) {
        toast.success('Password changed successfully!');
        onPasswordChanged();
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setIsChanging(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (newPassword.length === 0) return 'bg-gray-200';
    if (!passwordValidation.isValid) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthWidth = () => {
    if (newPassword.length === 0) return '0%';
    if (newPassword.length < 4) return '25%';
    if (newPassword.length < 8) return '50%';
    if (!passwordValidation.isValid) return '75%';
    return '100%';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              You are using a temporary password and must change it before continuing. 
              Please create a new secure password.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {user.temporaryPassword && (
              <div>
                <Label>Current Temporary Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your temporary password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Password Strength</span>
                  <span>{passwordValidation.isValid ? 'Strong' : 'Weak'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: getPasswordStrengthWidth() }}
                  ></div>
                </div>
                {newPassword.length > 0 && (
                  <p className={`text-xs mt-1 ${passwordValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {confirmPassword.length > 0 && (
                    passwordsMatch ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                      <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character (!@#$%&*)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={handlePasswordChange}
              disabled={
                isChanging || 
                !passwordValidation.isValid || 
                !passwordsMatch ||
                (user.temporaryPassword && currentPassword !== user.temporaryPassword)
              }
              className="w-full"
            >
              {isChanging ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}