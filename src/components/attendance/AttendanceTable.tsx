import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Clock, MoreHorizontal } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  avatar?: string;
  status?: AttendanceStatus;
}

interface AttendanceTableProps {
  students: Student[];
  onStatusChange?: (studentId: string, status: AttendanceStatus) => void;
  isEditable?: boolean;
  className?: string;
}

const statusConfig: Record<AttendanceStatus, { label: string; className: string; icon: React.ElementType }> = {
  present: {
    label: "Present",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
    icon: Check,
  },
  absent: {
    label: "Absent",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    icon: X,
  },
  late: {
    label: "Late",
    className: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
    icon: Clock,
  },
  excused: {
    label: "Excused",
    className: "bg-info/10 text-info hover:bg-info/20 border-info/20",
    icon: Check,
  },
};

export function AttendanceTable({
  students,
  onStatusChange,
  isEditable = false,
  className,
}: AttendanceTableProps) {
  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Student
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Roll No.
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            {isEditable && (
              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {students.map((student) => {
            const status = student.status || "present";
            const config = statusConfig[status];
            const StatusIcon = config.icon;

            return (
              <tr key={student.id} className="transition-colors hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{student.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {student.rollNumber}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={cn("gap-1", config.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </td>
                {isEditable && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {(["present", "absent", "late"] as AttendanceStatus[]).map((s) => {
                        const c = statusConfig[s];
                        const Icon = c.icon;
                        return (
                          <Button
                            key={s}
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-lg transition-all",
                              status === s && c.className
                            )}
                            onClick={() => onStatusChange?.(student.id, s)}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        );
                      })}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
