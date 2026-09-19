import { useState } from 'react';
import { Download, FileText, Calendar, Filter, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BorrowRequest } from '../types';

interface PDFReportPageProps {
  requests: BorrowRequest[];
  userId: string;
}

export function PDFReportPage({ requests, userId }: PDFReportPageProps) {
  const [reportType, setReportType] = useState<'all' | 'approved' | 'pending' | 'overdue'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const userRequests = requests.filter(r => r.studentId === userId);

  const calculatePenalty = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return diffDays * 5;
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

  const getFilteredRequests = () => {
    let filtered = userRequests;

    // Filter by type
    if (reportType === 'approved') {
      filtered = filtered.filter(r => r.status === 'Approved');
    } else if (reportType === 'pending') {
      filtered = filtered.filter(r => r.status === 'Pending');
    } else if (reportType === 'overdue') {
      filtered = filtered.filter(r => r.status === 'Approved' && isOverdue(r.dueDate));
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(r => r.requestDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(r => r.requestDate <= dateTo);
    }

    return filtered;
  };

  const generateDetailedReport = () => {
    const doc = new jsPDF();
    const filteredRequests = getFilteredRequests();

    // Header
    doc.setFontSize(22);
    doc.text('Equipment Borrowing and Tracking Return Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Student ID: ${userId}`, 105, 34, { align: 'center' });

    // Report Type
    doc.setFontSize(12);
    let reportTitle = 'All Requests';
    if (reportType === 'approved') reportTitle = 'Approved Requests';
    else if (reportType === 'pending') reportTitle = 'Pending Requests';
    else if (reportType === 'overdue') reportTitle = 'Overdue Requests';
    
    doc.text(`Report Type: ${reportTitle}`, 20, 45);

    if (dateFrom || dateTo) {
      const dateRange = `Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`;
      doc.setFontSize(10);
      doc.text(dateRange, 20, 52);
    }

    // Summary Statistics
    const totalRequests = filteredRequests.length;
    const approvedCount = filteredRequests.filter(r => r.status === 'Approved').length;
    const pendingCount = filteredRequests.filter(r => r.status === 'Pending').length;
    const overdueCount = filteredRequests.filter(r => r.status === 'Approved' && isOverdue(r.dueDate)).length;
    const totalPenalties = filteredRequests
      .filter(r => r.status === 'Approved')
      .reduce((sum, r) => sum + calculatePenalty(r.dueDate), 0);

    const summaryData = [
      ['Total Requests', totalRequests.toString()],
      ['Approved', approvedCount.toString()],
      ['Pending', pendingCount.toString()],
      ['Overdue', overdueCount.toString()],
      ['Total Penalties', `₱${totalPenalties}.00`],
    ];

    autoTable(doc, {
      startY: dateFrom || dateTo ? 58 : 52,
      head: [['Summary', 'Count']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
    });

    // Detailed Table
    const tableData = filteredRequests.map(req => {
      const penalty = calculatePenalty(req.dueDate);
      const overdueStatus = req.status === 'Approved' && isOverdue(req.dueDate) ? 'Yes' : 'No';
      
      return [
        req.requestDate,
        req.equipmentName,
        req.equipmentQRCode,
        req.dueDate,
        req.status,
        overdueStatus,
        penalty > 0 ? `$${penalty}` : '-',
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Request Date', 'Equipment', 'QR Code', 'Due Date', 'Status', 'Overdue', 'Penalty']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
      },
    });

    // Notes section
    const yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text('Notes:', 20, yPosition);
    doc.setFontSize(8);
    doc.text('• Late return penalty: $5.00 per day', 20, yPosition + 5);
    doc.text('• Please return equipment on or before the due date', 20, yPosition + 10);
    doc.text('• Contact admin for any issues or questions', 20, yPosition + 15);

    // Footer
    doc.setFontSize(8);
    doc.text('This is a computer-generated report.', 105, 285, { align: 'center' });

    // Save
    doc.save(`equipment-report-${userId}-${new Date().getTime()}.pdf`);
  };

  const generateSummaryReport = () => {
    const doc = new jsPDF();
    const filteredRequests = getFilteredRequests();

    // Header
    doc.setFontSize(22);
    doc.text('Equipment Borrowing and Tracking Return Summary', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Student ID: ${userId}`, 105, 34, { align: 'center' });

    // Statistics
    const totalRequests = filteredRequests.length;
    const approvedCount = filteredRequests.filter(r => r.status === 'Approved').length;
    const pendingCount = filteredRequests.filter(r => r.status === 'Pending').length;
    const rejectedCount = filteredRequests.filter(r => r.status === 'Rejected').length;
    const overdueCount = filteredRequests.filter(r => r.status === 'Approved' && isOverdue(r.dueDate)).length;
    const totalPenalties = filteredRequests
      .filter(r => r.status === 'Approved')
      .reduce((sum, r) => sum + calculatePenalty(r.dueDate), 0);

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Requests', totalRequests.toString()],
      ['Approved Requests', approvedCount.toString()],
      ['Pending Requests', pendingCount.toString()],
      ['Rejected Requests', rejectedCount.toString()],
      ['Overdue Items', overdueCount.toString()],
      ['Total Penalties', `₱${totalPenalties}.00`],
    ];

    autoTable(doc, {
      startY: 45,
      body: summaryData,
      theme: 'striped',
      styles: { fontSize: 12 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 80, halign: 'center' },
      },
    });

    // Save
    doc.save(`equipment-summary-${userId}-${new Date().getTime()}.pdf`);
  };

  const filteredRequests = getFilteredRequests();
  const overdueRequests = filteredRequests.filter(r => r.status === 'Approved' && isOverdue(r.dueDate));
  const totalPenalties = overdueRequests.reduce((sum, r) => sum + calculatePenalty(r.dueDate), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">PDF Report Generator</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="reportType" className="block mb-2 text-sm text-gray-700">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Requests</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block mb-2 text-sm text-gray-700">
              Date From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block mb-2 text-sm text-gray-700">
              Date To
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Total Requests</p>
          <p className="text-2xl">{filteredRequests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-2xl text-green-600">
            {filteredRequests.filter(r => r.status === 'Approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl text-red-600">{overdueRequests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Total Penalties</p>
          <p className="text-2xl text-red-600">₱{totalPenalties}.00</p>
        </div>
      </div>

      {/* Overdue Warning */}
      {overdueRequests.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 mb-1">Overdue Items Alert</h4>
              <p className="text-sm text-red-700">
                You have {overdueRequests.length} overdue item(s) with a total penalty of ₱{totalPenalties}.00
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg">Detailed Report</h3>
              <p className="text-sm text-gray-600">Complete list of all requests</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Includes request dates, equipment details, barcodes, due dates, status, and penalties.
          </p>
          <button
            onClick={generateDetailedReport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Detailed Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg">Summary Report</h3>
              <p className="text-sm text-gray-600">Quick overview of statistics</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Includes total counts, approved/pending requests, overdue items, and penalty totals.
          </p>
          <button
            onClick={generateSummaryReport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Summary Report
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Report Preview ({filteredRequests.length} records)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-gray-600">Date</th>
                <th className="text-left py-2 px-3 text-gray-600">Equipment</th>
                <th className="text-left py-2 px-3 text-gray-600">Status</th>
                <th className="text-left py-2 px-3 text-gray-600">Due Date</th>
                <th className="text-left py-2 px-3 text-gray-600">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.slice(0, 10).map(req => {
                const penalty = calculatePenalty(req.dueDate);
                return (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{req.requestDate}</td>
                    <td className="py-2 px-3">{req.equipmentName}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={isOverdue(req.dueDate) && req.status === 'Approved' ? 'text-red-600' : ''}>
                        {req.dueDate}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {penalty > 0 ? (
                        <span className="text-red-600">₱{penalty}.00</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length > 10 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              Showing 10 of {filteredRequests.length} records. Download report for full list.
            </p>
          )}
          {filteredRequests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No data to display</p>
          )}
        </div>
      </div>
    </div>
  );
}