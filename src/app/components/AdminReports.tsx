import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Award, AlertTriangle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BorrowRequest, Equipment } from '../types';

interface AdminReportsProps {
  requests: BorrowRequest[];
  equipment: Equipment[];
}

export function AdminReports({ requests, equipment }: AdminReportsProps) {
  const [reportType, setReportType] = useState<'penalties' | 'good' | 'all'>('all');

  const calculatePenalty = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return diffDays * 20;
    }
    return 0;
  };

  const isOverdue = (dueDate: string): boolean => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return today > due;
  };

  // Get student penalty records
  const getPenaltyRecords = () => {
    const studentMap = new Map<string, {
      studentId: string;
      studentName: string;
      course: string;
      contact: string;
      totalPenalty: number;
      overdueCount: number;
      requests: BorrowRequest[];
    }>();

    requests
      .filter(r => r.status === 'Approved')
      .forEach(req => {
        const penalty = calculatePenalty(req.dueDate);
        if (penalty > 0 || isOverdue(req.dueDate)) {
          if (!studentMap.has(req.studentId)) {
            studentMap.set(req.studentId, {
              studentId: req.studentId,
              studentName: req.studentName,
              course: req.studentCourse,
              contact: req.studentContact,
              totalPenalty: 0,
              overdueCount: 0,
              requests: [],
            });
          }
          const student = studentMap.get(req.studentId)!;
          student.totalPenalty += penalty;
          student.overdueCount++;
          student.requests.push(req);
        }
      });

    return Array.from(studentMap.values()).sort((a, b) => b.totalPenalty - a.totalPenalty);
  };

  // Get good records (students with no penalties)
  const getGoodRecords = () => {
    const studentMap = new Map<string, {
      studentId: string;
      studentName: string;
      course: string;
      contact: string;
      totalBorrowed: number;
      onTimeReturns: number;
      requests: BorrowRequest[];
    }>();

    requests.forEach(req => {
      if (!studentMap.has(req.studentId)) {
        studentMap.set(req.studentId, {
          studentId: req.studentId,
          studentName: req.studentName,
          course: req.studentCourse,
          contact: req.studentContact,
          totalBorrowed: 0,
          onTimeReturns: 0,
          requests: [],
        });
      }
      const student = studentMap.get(req.studentId)!;
      
      if (req.status === 'Approved' || req.status === 'Returned') {
        student.totalBorrowed++;
        student.requests.push(req);
        
        if (req.status === 'Returned' && (req.penalty === undefined || req.penalty === 0)) {
          student.onTimeReturns++;
        } else if (req.status === 'Approved' && !isOverdue(req.dueDate)) {
          student.onTimeReturns++;
        }
      }
    });

    return Array.from(studentMap.values())
      .filter(s => s.totalBorrowed > 0 && s.onTimeReturns === s.totalBorrowed)
      .sort((a, b) => b.totalBorrowed - a.totalBorrowed);
  };

  const penaltyRecords = getPenaltyRecords();
  const goodRecords = getGoodRecords();
  const totalPenalties = penaltyRecords.reduce((sum, r) => sum + r.totalPenalty, 0);

  // Generate Penalty Report PDF
  const generatePenaltyReport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(239, 68, 68);
    doc.text('Student Penalty Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Equipment Borrowing and Tracking Return System - WCC', 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Summary', 20, 45);

    const summaryData = [
      ['Total Students with Penalties:', penaltyRecords.length.toString()],
      ['Total Penalty Amount:', `₱${totalPenalties}.00`],
      ['Total Overdue Items:', penaltyRecords.reduce((sum, r) => sum + r.overdueCount, 0).toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, textColor: [55, 65, 81] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70, textColor: [107, 114, 128] },
        1: { cellWidth: 'auto', textColor: [239, 68, 68], fontStyle: 'bold' },
      },
    });

    // Detailed Table
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Detailed Penalty Records', 20, (doc as any).lastAutoTable.finalY + 15);

    const tableData = penaltyRecords.map(student => [
      student.studentId,
      student.studentName,
      student.course,
      student.overdueCount.toString(),
      `₱${student.totalPenalty}.00`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Student ID', 'Name', 'Course', 'Overdue Items', 'Total Penalty']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
      styles: { fontSize: 9, textColor: [55, 65, 81] },
      columnStyles: {
        4: { textColor: [239, 68, 68], fontStyle: 'bold' },
      },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Official report from Equipment Borrowing and Tracking Return System', 105, 280, { align: 'center' });

    doc.save(`penalty-report-${Date.now()}.pdf`);
  };

  // Generate Good Records Report PDF
  const generateGoodRecordsReport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('Student Good Records Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Equipment Borrowing and Tracking Return System - WCC', 105, 28, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 34, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Summary', 20, 45);

    const summaryData = [
      ['Total Students with Good Records:', goodRecords.length.toString()],
      ['Total On-Time Returns:', goodRecords.reduce((sum, r) => sum + r.onTimeReturns, 0).toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, textColor: [55, 65, 81] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90, textColor: [107, 114, 128] },
        1: { cellWidth: 'auto', textColor: [16, 185, 129], fontStyle: 'bold' },
      },
    });

    // Detailed Table
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Detailed Good Records', 20, (doc as any).lastAutoTable.finalY + 15);

    const tableData = goodRecords.map(student => [
      student.studentId,
      student.studentName,
      student.course,
      student.totalBorrowed.toString(),
      student.onTimeReturns.toString(),
      '100%',
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Student ID', 'Name', 'Course', 'Total Borrowed', 'On-Time Returns', 'Success Rate']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      styles: { fontSize: 9, textColor: [55, 65, 81] },
      columnStyles: {
        5: { textColor: [16, 185, 129], fontStyle: 'bold' },
      },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Official report from Equipment Borrowing and Tracking Return System', 105, 280, { align: 'center' });

    doc.save(`good-records-report-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-800">Student Records & Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={generatePenaltyReport}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Penalty Report
          </button>
          <button
            onClick={generateGoodRecordsReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Good Records
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Students with Penalties</p>
              <p className="text-2xl text-red-600">{penaltyRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Penalties</p>
              <p className="text-2xl text-red-600">₱{totalPenalties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Good Records</p>
              <p className="text-2xl text-green-600">{goodRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl text-blue-600">{requests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => setReportType('all')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            reportType === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setReportType('penalties')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            reportType === 'penalties'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Penalties Only
        </button>
        <button
          onClick={() => setReportType('good')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            reportType === 'good'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Good Records Only
        </button>
      </div>

      {/* Penalty Records */}
      {(reportType === 'all' || reportType === 'penalties') && penaltyRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Students with Penalties
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="text-left py-3 px-4 text-sm">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm">Name</th>
                  <th className="text-left py-3 px-4 text-sm">Course</th>
                  <th className="text-left py-3 px-4 text-sm">Contact</th>
                  <th className="text-left py-3 px-4 text-sm">Overdue Items</th>
                  <th className="text-left py-3 px-4 text-sm">Total Penalty</th>
                </tr>
              </thead>
              <tbody>
                {penaltyRecords.map(student => (
                  <tr key={student.studentId} className="border-b hover:bg-red-50">
                    <td className="py-3 px-4 text-sm">{student.studentId}</td>
                    <td className="py-3 px-4">{student.studentName}</td>
                    <td className="py-3 px-4 text-sm">{student.course}</td>
                    <td className="py-3 px-4 text-sm">{student.contact}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {student.overdueCount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-lg text-red-600">₱{student.totalPenalty}.00</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Good Records */}
      {(reportType === 'all' || reportType === 'good') && goodRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-green-700 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Students with Good Records
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="text-left py-3 px-4 text-sm">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm">Name</th>
                  <th className="text-left py-3 px-4 text-sm">Course</th>
                  <th className="text-left py-3 px-4 text-sm">Contact</th>
                  <th className="text-left py-3 px-4 text-sm">Total Borrowed</th>
                  <th className="text-left py-3 px-4 text-sm">On-Time Returns</th>
                  <th className="text-left py-3 px-4 text-sm">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {goodRecords.map(student => (
                  <tr key={student.studentId} className="border-b hover:bg-green-50">
                    <td className="py-3 px-4 text-sm">{student.studentId}</td>
                    <td className="py-3 px-4">{student.studentName}</td>
                    <td className="py-3 px-4 text-sm">{student.course}</td>
                    <td className="py-3 px-4 text-sm">{student.contact}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {student.totalBorrowed}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {student.onTimeReturns}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg text-green-600">100%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'penalties' && penaltyRecords.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No penalty records found</p>
          <p className="text-sm text-gray-500 mt-1">All students are in good standing!</p>
        </div>
      )}

      {reportType === 'good' && goodRecords.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No good records found</p>
          <p className="text-sm text-gray-500 mt-1">No completed borrowing records yet</p>
        </div>
      )}
    </div>
  );
}
