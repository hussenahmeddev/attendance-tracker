import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName, getRoleColor } from '@/lib/userUtils';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, IdCard, Loader2 } from 'lucide-react';

export const UserProfile = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No user data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{userData.displayName}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(userData.role)}`}>
                {getRoleDisplayName(userData.role)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IdCard className="h-4 w-4" />
                <span className="font-mono font-medium">{userData.userId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{userData.email}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};