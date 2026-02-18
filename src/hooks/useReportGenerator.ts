
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchAllAttendance, fetchStudentAttendance, fetchTeacherAttendance, getAttendanceStatistics, type AttendanceRecord } from '@/lib/attendanceUtils';

export type ReportType = 'summary' | 'student' | 'class' | 'system';
export type ReportFormat = 'pdf' | 'csv' | 'excel' | 'json';
export type DateRangeType = 'week' | 'month' | 'semester' | 'year' | 'all';

interface GenerateReportParams {
    type: ReportType;
    format: ReportFormat;
    dateRange: DateRangeType;
    targetId?: string; // studentId or classId
    title?: string;
    role?: 'admin' | 'teacher';
    userId?: string; // For teacher role
}

export const useReportGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getDateRange = (range: DateRangeType) => {
        const today = new Date();
        let startDate = new Date();

        switch (range) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'semester':
                startDate.setMonth(today.getMonth() - 6);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case 'all':
                return { startDate: undefined, endDate: undefined };
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        };
    };

    const generatePDF = (data: any[], title: string, columns: string[], rows: any[]) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Table
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [63, 81, 181] }
        });

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateExcel = (data: any[], title: string) => {
        if (data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

        // Add title and metadata
        const titleRow = [title];
        const metaRow = [`Generated on: ${new Date().toLocaleDateString()}`];
        
        XLSX.utils.sheet_add_aoa(worksheet, [titleRow, metaRow, []], { origin: 'A1' });
        
        XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    const generateCSV = (data: any[], title: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                const val = row[fieldName as keyof typeof row];
                return JSON.stringify(val === undefined ? '' : val);
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const generateReport = async ({
        type,
        format,
        dateRange,
        targetId,
        title = 'Attendance Report',
        role = 'admin',
        userId
    }: GenerateReportParams) => {
        setIsGenerating(true);
        setError(null);

        try {
            const { startDate, endDate } = getDateRange(dateRange);
            let data: any[] = [];
            let columns: string[] = [];
            let rows: any[] = [];

            // Fetch Data
            if (type === 'summary') {
                const stats = await getAttendanceStatistics(startDate, endDate, undefined, role === 'teacher' ? userId : undefined);
                data = [{
                    'Period': dateRange,
                    'Total Records': stats.totalRecords,
                    'Present': stats.presentCount,
                    'Absent': stats.absentCount,
                    'Late': stats.lateCount,
                    'Excused': stats.excusedCount,
                    'Attendance Rate': `${stats.attendanceRate}%`
                }];
                columns = ['Metric', 'Value'];
                rows = Object.entries(data[0]);
            } else if (type === 'student' && targetId) {
                const records = await fetchStudentAttendance(targetId, startDate, endDate);
                data = records.map(r => ({
                    'Date': r.date,
                    'Class': r.className,
                    'Status': r.status,
                    'Marked By': r.teacherName,
                    'Notes': r.notes || ''
                }));
                columns = ['Date', 'Class', 'Status', 'Marked By', 'Notes'];
                rows = data.map(d => Object.values(d));
            } else if (type === 'class' && targetId) {
                // We'll use fetchAllAttendance and filter in memory for class since specific class fetch might need updating
                // or we can add a specific fetchClassAttendance if needed, but for now filtering is safer given current tools
                let records = [];
                if (role === 'teacher' && userId) {
                    records = await fetchTeacherAttendance(userId, startDate, endDate);
                    records = records.filter(r => r.classId === targetId);
                } else {
                    records = await fetchAllAttendance(startDate, endDate);
                    records = records.filter(r => r.classId === targetId);
                }

                data = records.map(r => ({
                    'Date': r.date,
                    'Student': r.studentName,
                    'Status': r.status,
                    'Notes': r.notes || ''
                }));
                columns = ['Date', 'Student', 'Status', 'Notes'];
                rows = data.map(d => Object.values(d));
            } else if (type === "system") {
                // similar to summary but maybe more broadly compatible if needed
                const stats = await getAttendanceStatistics(startDate, endDate);
                data = [{
                    'Period': dateRange,
                    'Total Records': stats.totalRecords,
                    'Unique Students': stats.uniqueStudents,
                    'Unique Classes': stats.uniqueClasses,
                    'Attendance Rate': `${stats.attendanceRate}%`
                }];
                columns = ['Metric', 'Value'];
                rows = Object.entries(data[0]);
            }

            if (data.length === 0) {
                throw new Error('No data found for the selected criteria');
            }

            // Generate File
            if (format === 'pdf') {
                generatePDF(data, title, columns, rows);
            } else if (format === 'excel') {
                generateExcel(data, title);
            } else if (format === 'csv') {
                generateCSV(data, title);
            } else if (format === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.json`;
                link.click();
            }

            return true;
        } catch (err) {
            console.error('Report generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate report');
            return false;
        } finally {
            setIsGenerating(false);
        }
    };

    return { generateReport, isGenerating, error };
};
