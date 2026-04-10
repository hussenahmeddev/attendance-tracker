# EduAttendance Tracker

A robust, role-based educational attendance and management system built with React, Vite, TypeScript, and Firebase. This application stream-lines the process of taking attendance, managing classes, processing student leave requests, and generating analytical reports.

## Tech Stack
* **Frontend Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling & UI Components**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
* **Routing**: [React Router v6](https://reactrouter.com/)
* **Data Fetching/Caching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
* **Backend Services**: [Firebase/Firestore](https://firebase.google.com/docs/firestore)
* **Charts**: [Recharts](https://recharts.org/)

## Application Roles & Features

The platform implements strict role-based access control leveraging Firestore Security Rules, categorizing users into three primary tiers:

### 1. Admin
* **Admin Dashboard**: High-level overview of system metrics and recent activities.
* **User Management**: Create, update, and manage accounts (provisioning students, teachers, and other admins).
* **Class Management**: Create and assign classes, manage enrollments.
* **Attendance Oversight**: Monitor full school attendance records and investigate anomalies.
* **System Utilities & Settings**: Configure global application parameters and view system health.
* **Reports**: Run detailed, granular reports for compliance and school records.

### 2. Teacher
* **Dashboard**: Focus on assigned classes and pending immediate tasks.
* **Class Management**: Manage schedules and student rosters for their tailored classes.
* **Attendance**: Quick-action interfaces to take daily or period-based attendance securely.
* **Leave/Excuse Approvals**: Review and explicitly approve or deny leave requests initiated by students.
* **Reports**: Visualize insights into individual student performance and class attendance trends.

### 3. Student
* **Student Dashboard**: Quick glance at personal attendance rating, schedules, and active tasks.
* **Leave Requests**: Request excused absences and view the approval status pipeline.
* **Settings**: Manage basic personal profile details and notification references.

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/en) (v18+)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Firebase configurations:
   Create a `.env` file at the root of your project with your Firebase Project configurations:
   ```env
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Building for Production
Create an optimized production build:
```bash
npm run build
```

The compiled assets will be available inside the `dist` directory.

## Firebase Configuration

This project expects a configured instance of **Firebase Authentication** and **Cloud Firestore**. Make sure to deploy the provided Firestore rules located in `firestore.rules.example` (saving them to your Firebase Console under Firestore Database -> Rules) to ensure your system adheres to the designed role-based access controls.
