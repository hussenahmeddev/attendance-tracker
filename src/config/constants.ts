/**
 * Application Configuration Constants
 * All hardcoded values should be defined here for easy maintenance
 */

// Attendance Thresholds
export const ATTENDANCE_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  SATISFACTORY: 75,
  LOW_ATTENDANCE_ALERT: 80,
} as const;

// Attendance Grades
export const ATTENDANCE_GRADES = {
  EXCELLENT: {
    grade: 'Excellent',
    color: 'text-green-600',
    bg: 'bg-green-50',
    threshold: ATTENDANCE_THRESHOLDS.EXCELLENT,
    description: 'Outstanding! You\'re setting a great example for consistent attendance.'
  },
  GOOD: {
    grade: 'Good',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    threshold: ATTENDANCE_THRESHOLDS.GOOD,
    description: 'Good work! Keep maintaining regular attendance for academic success.'
  },
  SATISFACTORY: {
    grade: 'Satisfactory',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    threshold: ATTENDANCE_THRESHOLDS.SATISFACTORY,
    description: 'Try to improve attendance. Consider speaking with your advisor if you\'re facing challenges.'
  },
  NEEDS_IMPROVEMENT: {
    grade: 'Needs Improvement',
    color: 'text-red-600',
    bg: 'bg-red-50',
    threshold: 0,
    description: 'Please speak with your advisor immediately about improving attendance.'
  }
} as const;

// Default Values
export const DEFAULT_VALUES = {
  ATTENDANCE_RATE: 0,
  TOTAL_CLASSES: 0,
  CLASSES_TODAY: 0,
  TOTAL_STUDENTS: 0,
  PENDING_REQUESTS: 0,
  MAX_STUDENTS_PER_CLASS: 30,
  STUDENT_COUNT: 0,
} as const;

// Report Calculations
export const REPORT_CALCULATIONS = {
  REGULAR_ATTENDEES_PERCENTAGE: 0.85,
  NEEDS_ATTENTION_PERCENTAGE: 0.15,
} as const;

// Placeholder Ranges (for demo data)
export const PLACEHOLDER_RANGES = {
  MIN_ATTENDANCE: 60,
  MAX_ATTENDANCE: 95,
  ATTENDANCE_RANGE: 36,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  AVATAR_SIZE: {
    SMALL: 'w-10 h-10',
    MEDIUM: 'w-12 h-12',
    LARGE: 'w-16 h-16',
  },
  LOADING_SPINNER: {
    SMALL: 'h-6 w-6',
    MEDIUM: 'h-8 w-8',
    LARGE: 'h-12 w-12',
  },
} as const;

// Status Badge Colors
export const STATUS_COLORS = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  EXCUSED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  SYSTEM: 'bg-green-100 text-green-800',
  NEW: 'bg-blue-100 text-blue-800',
} as const;

// Calendar Event Colors
export const CALENDAR_COLORS = {
  HOLIDAY: 'bg-red-100 text-red-800 border-red-200',
  EXAM: 'bg-orange-100 text-orange-800 border-orange-200',
  EVENT: 'bg-blue-100 text-blue-800 border-blue-200',
  BREAK: 'bg-green-100 text-green-800 border-green-200',
  SYSTEM: 'bg-purple-100 text-purple-800 border-purple-200',
  DEFAULT: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

// Helper Functions
export const getAttendanceGrade = (percentage: number) => {
  if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return ATTENDANCE_GRADES.EXCELLENT;
  if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return ATTENDANCE_GRADES.GOOD;
  if (percentage >= ATTENDANCE_THRESHOLDS.SATISFACTORY) return ATTENDANCE_GRADES.SATISFACTORY;
  return ATTENDANCE_GRADES.NEEDS_IMPROVEMENT;
};

export const isLowAttendance = (percentage: number) => {
  return percentage < ATTENDANCE_THRESHOLDS.LOW_ATTENDANCE_ALERT;
};

export const calculateRegularAttendees = (totalStudents: number) => {
  return Math.round(totalStudents * REPORT_CALCULATIONS.REGULAR_ATTENDEES_PERCENTAGE);
};

export const calculateNeedsAttention = (totalStudents: number) => {
  return Math.round(totalStudents * REPORT_CALCULATIONS.NEEDS_ATTENTION_PERCENTAGE);
};