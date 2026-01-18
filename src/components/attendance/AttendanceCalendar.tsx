import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "holiday" | "weekend" | null;

interface AttendanceCalendarProps {
  attendanceData: Record<string, AttendanceStatus>;
  className?: string;
}

const statusColors: Record<NonNullable<AttendanceStatus>, string> = {
  present: "bg-success text-success-foreground",
  absent: "bg-destructive text-destructive-foreground",
  late: "bg-warning text-warning-foreground",
  excused: "bg-info text-info-foreground",
  holiday: "bg-info/20 text-info",
  weekend: "bg-muted text-muted-foreground",
};

export function AttendanceCalendar({ attendanceData, className }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const renderDays = () => {
    const cells = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(
        <div key={`empty-${i}`} className="p-2" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const status = attendanceData[dateKey];
      const dayOfWeek = new Date(year, month, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const effectiveStatus = status || (isWeekend ? "weekend" : null);

      cells.push(
        <div
          key={day}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all",
            effectiveStatus ? statusColors[effectiveStatus] : "hover:bg-muted",
            !effectiveStatus && "text-foreground"
          )}
        >
          {day}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attendance Calendar</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {monthName} {year}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day}
            className="flex h-10 items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {renderDays()}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-info" />
          <span className="text-xs text-muted-foreground">Excused</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-info/50" />
          <span className="text-xs text-muted-foreground">Holiday</span>
        </div>
      </div>
    </div>
  );
}
