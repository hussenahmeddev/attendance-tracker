import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const mockClasses = [
  { id: "1", name: "Mathematics Grade 10", students: 28 },
  { id: "2", name: "Physics Grade 11", students: 24 }
];

const mockStudents = [
  { id: "1", name: "John Doe", rollNo: "STD001", status: "present" as const },
  { id: "2", name: "Jane Smith", rollNo: "STD002", status: "absent" as const },
  { id: "3", name: "Mike Johnson", rollNo: "STD003", status: "present" as const },
];

export default function TeacherAttendance() {
  const [selectedClass, setSelectedClass] = useState(mockClasses[0]);
  const [students, setStudents] = useState(mockStudents);

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Take Attendance"
      pageDescription="Mark student attendance for your classes"
    >
      <div className="space-y-6">
        <UserProfile />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Take Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Class:</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedClass.id}
                onChange={(e) => setSelectedClass(mockClasses.find(c => c.id === e.target.value) || mockClasses[0])}
              >
                {mockClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">{selectedClass.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()} • {selectedClass.students} students
              </p>
            </div>

            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={student.status === "present" ? "default" : "outline"}
                      onClick={() => handleAttendanceChange(student.id, "present")}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === "absent" ? "destructive" : "outline"}
                      onClick={() => handleAttendanceChange(student.id, "absent")}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Absent
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === "late" ? "secondary" : "outline"}
                      onClick={() => handleAttendanceChange(student.id, "late")}
                      className="gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Late
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <Button className="flex-1">
                Save Attendance
              </Button>
              <Button variant="outline">
                Mark All Present
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}