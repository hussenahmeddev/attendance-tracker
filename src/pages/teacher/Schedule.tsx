import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserProfile } from "@/components/UserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Edit, Plus, Users, MapPin, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTeacherClasses, type Class } from "@/lib/classUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateClass } from "@/lib/classUtils";
import { toast } from "sonner";

export default function TeacherSchedule() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    schedule: '',
    room: '',
    startTime: '',
    endTime: '',
    days: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false);
  const [addScheduleData, setAddScheduleData] = useState({
    classId: '',
    schedule: '',
    room: '',
    startTime: '',
    endTime: '',
    days: [] as string[]
  });

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!userData?.userId) return;

      try {
        setLoading(true);
        const fetchedClasses = await fetchTeacherClasses(userData.userId);
        setClasses(fetchedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userData]);

  const handleEditClick = (cls: Class) => {
    setSelectedClass(cls);
    setEditFormData({
      schedule: cls.schedule || '',
      room: cls.room || '',
      startTime: '',
      endTime: '',
      days: []
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setSaving(true);
      
      // Generate schedule text from structured inputs if provided
      const scheduleText = editFormData.days.length > 0 && editFormData.startTime && editFormData.endTime
        ? `${editFormData.days.join(', ')} ${editFormData.startTime} - ${editFormData.endTime}`
        : editFormData.schedule || 'To be scheduled';

      await updateClass(selectedClass.id, {
        schedule: scheduleText,
        room: editFormData.room
      });

      // Update local state
      setClasses(prev => prev.map(c =>
        c.id === selectedClass.id
          ? { ...c, schedule: scheduleText, room: editFormData.room }
          : c
      ));

      toast.success("Schedule updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error("Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addScheduleData.classId) {
      toast.error("Please select a class");
      return;
    }

    try {
      setSaving(true);
      
      // Generate schedule text from structured inputs if provided
      const scheduleText = addScheduleData.days.length > 0 && addScheduleData.startTime && addScheduleData.endTime
        ? `${addScheduleData.days.join(', ')} ${addScheduleData.startTime} - ${addScheduleData.endTime}`
        : addScheduleData.schedule || 'To be scheduled';

      await updateClass(addScheduleData.classId, {
        schedule: scheduleText,
        room: addScheduleData.room
      });

      // Update local state
      setClasses(prev => prev.map(c =>
        c.id === addScheduleData.classId
          ? { ...c, schedule: scheduleText, room: addScheduleData.room }
          : c
      ));

      toast.success("Schedule added successfully");
      setIsAddScheduleDialogOpen(false);
      setAddScheduleData({ classId: '', schedule: '', room: '', startTime: '', endTime: '', days: [] });
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error("Failed to add schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="teacher"
      pageTitle="Class Schedule"
      pageDescription="View and manage your class schedules"
    >
      <div className="space-y-6">
        <UserProfile />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Class Schedule
              </CardTitle>
              <Button variant="outline" onClick={() => setIsAddScheduleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading schedule...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Schedule Overview */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                      <p className="text-sm text-muted-foreground">Total Classes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {classes.reduce((acc, cls) => acc + cls.students, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {classes.filter(cls => cls.status === 'active').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Class Schedule List */}
                <div className="space-y-4">
                  {classes.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No classes scheduled</p>
                      <p className="text-sm text-muted-foreground">Contact admin to get classes assigned</p>
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{cls.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {cls.schedule || "Not scheduled"}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {cls.room || "No room"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {cls.students} students
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={cls.status === "active" ? "default" : "secondary"}>
                            {cls.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(cls)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Weekly Schedule View */}
                {classes.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4">Weekly Schedule</h3>
                    <div className="grid gap-4 md:grid-cols-5">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <div key={day} className="space-y-2">
                          <h4 className="font-medium text-center">{day}</h4>
                          <div className="space-y-1">
                            {classes
                              .filter(cls => cls.schedule && cls.schedule.toLowerCase().includes(day.toLowerCase().slice(0, 3)))
                              .map((cls) => (
                                <div key={`${day}-${cls.id}`} className="p-2 border rounded text-xs bg-muted/20">
                                  <div className="font-medium">{cls.subject}</div>
                                  <div className="text-muted-foreground">
                                    {cls.schedule.split(' - ')[1] || cls.schedule}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Room: {cls.room}
                                  </div>
                                </div>
                              ))}
                            {classes.filter(cls => cls.schedule && cls.schedule.toLowerCase().includes(day.toLowerCase().slice(0, 3))).length === 0 && (
                              <div className="text-center p-2 text-xs text-muted-foreground border border-dashed rounded">
                                No classes
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class Schedule</DialogTitle>
            <DialogDescription>
              Update schedule and room information for {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editRoom">Room</Label>
                <Input
                  id="editRoom"
                  placeholder="e.g., Room 101, Lab 201"
                  value={editFormData.room}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, room: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCustomSchedule">Custom Schedule Text</Label>
                <Input
                  id="editCustomSchedule"
                  placeholder="e.g., Mon-Fri 9:00 AM - 10:00 AM"
                  value={editFormData.schedule}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, schedule: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Or Build Schedule:</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editStartTime">Start Time</Label>
                    <Input
                      id="editStartTime"
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEndTime">End Time</Label>
                    <Input
                      id="editEndTime"
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${day}`}
                          checked={editFormData.days.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditFormData(prev => ({
                                ...prev,
                                days: [...prev.days, day]
                              }));
                            } else {
                              setEditFormData(prev => ({
                                ...prev,
                                days: prev.days.filter(d => d !== day)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`edit-${day}`} className="text-sm font-normal">
                          {day.substring(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
              <strong>Note:</strong> You can either enter a custom schedule text or build one using the time and days fields. 
              The built schedule will override the custom text.
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddScheduleDialogOpen} onOpenChange={setIsAddScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <DialogDescription>
              Assign a schedule and room to one of your classes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <select
                id="class-select"
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                value={addScheduleData.classId}
                onChange={(e) => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setAddScheduleData({
                    classId: e.target.value,
                    schedule: cls?.schedule || '',
                    room: cls?.room || '',
                    startTime: '',
                    endTime: '',
                    days: []
                  });
                }}
                required
              >
                <option value="">Choose a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addRoom">Room</Label>
                <Input
                  id="addRoom"
                  placeholder="e.g., Room 101, Lab 201"
                  value={addScheduleData.room}
                  onChange={(e) => setAddScheduleData(prev => ({ ...prev, room: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addCustomSchedule">Custom Schedule Text</Label>
                <Input
                  id="addCustomSchedule"
                  placeholder="e.g., Mon-Fri 9:00 AM - 10:00 AM"
                  value={addScheduleData.schedule}
                  onChange={(e) => setAddScheduleData(prev => ({ ...prev, schedule: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Or Build Schedule:</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="addStartTime">Start Time</Label>
                    <Input
                      id="addStartTime"
                      type="time"
                      value={addScheduleData.startTime}
                      onChange={(e) => setAddScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addEndTime">End Time</Label>
                    <Input
                      id="addEndTime"
                      type="time"
                      value={addScheduleData.endTime}
                      onChange={(e) => setAddScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`add-${day}`}
                          checked={addScheduleData.days.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAddScheduleData(prev => ({
                                ...prev,
                                days: [...prev.days, day]
                              }));
                            } else {
                              setAddScheduleData(prev => ({
                                ...prev,
                                days: prev.days.filter(d => d !== day)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`add-${day}`} className="text-sm font-normal">
                          {day.substring(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
              <strong>Note:</strong> You can either enter a custom schedule text or build one using the time and days fields. 
              The built schedule will override the custom text.
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}